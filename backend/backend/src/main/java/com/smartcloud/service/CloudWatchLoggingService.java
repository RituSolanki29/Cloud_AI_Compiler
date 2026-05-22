package com.smartcloud.service;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.*;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudWatchLoggingService {

    private final CloudWatchLogsClient cloudWatchLogsClient;

    @Value("${aws.cloudwatch.log-group:/smartcloud/backend-logs}")
    private String logGroupName;

    private String logStreamName;
    private final BlockingQueue<InputLogEvent> logQueue = new LinkedBlockingQueue<>(5000);
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private String sequenceToken = null;
    private CustomAppender customAppender;

    @PostConstruct
    public void init() {
        // Daily stream name: stream-yyyy-MM-dd
        String dateSuffix = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        this.logStreamName = "stream-" + dateSuffix;

        try {
            ensureLogGroupAndStreamExists();
            
            // Register programmatic Logback Appender
            LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
            customAppender = new CustomAppender(logQueue);
            customAppender.setContext(context);
            customAppender.setName("CloudWatchAppender");
            customAppender.start();

            Logger rootLogger = context.getLogger(Logger.ROOT_LOGGER_NAME);
            rootLogger.addAppender(customAppender);

            // Start log consumer scheduled task (runs every 2 seconds)
            scheduler.scheduleWithFixedDelay(this::flushLogs, 2, 2, TimeUnit.SECONDS);
            log.info("Initialized CloudWatch log shipper for group '{}' stream '{}'", logGroupName, logStreamName);
        } catch (Exception e) {
            log.error("Failed to initialize CloudWatch logging service", e);
        }
    }

    private void ensureLogGroupAndStreamExists() {
        try {
            // Check if log group exists
            DescribeLogGroupsRequest describeGroups = DescribeLogGroupsRequest.builder()
                    .logGroupNamePrefix(logGroupName)
                    .build();
            boolean groupExists = cloudWatchLogsClient.describeLogGroups(describeGroups).logGroups().stream()
                    .anyMatch(g -> g.logGroupName().equals(logGroupName));

            if (!groupExists) {
                CreateLogGroupRequest createGroup = CreateLogGroupRequest.builder()
                        .logGroupName(logGroupName)
                        .build();
                cloudWatchLogsClient.createLogGroup(createGroup);
            }

            // Check if log stream exists
            DescribeLogStreamsRequest describeStreams = DescribeLogStreamsRequest.builder()
                    .logGroupName(logGroupName)
                    .logStreamNamePrefix(logStreamName)
                    .build();
            
            boolean streamExists = cloudWatchLogsClient.describeLogStreams(describeStreams).logStreams().stream()
                    .anyMatch(s -> s.logStreamName().equals(logStreamName));

            if (!streamExists) {
                CreateLogStreamRequest createStream = CreateLogStreamRequest.builder()
                        .logGroupName(logGroupName)
                        .logStreamName(logStreamName)
                        .build();
                cloudWatchLogsClient.createLogStream(createStream);
            } else {
                // Get initial sequence token if the stream already exists
                LogStream stream = cloudWatchLogsClient.describeLogStreams(describeStreams).logStreams().stream()
                        .filter(s -> s.logStreamName().equals(logStreamName))
                        .findFirst().orElse(null);
                if (stream != null) {
                    this.sequenceToken = stream.uploadSequenceToken();
                }
            }
        } catch (Exception e) {
            System.err.println("CloudWatch Logging Bootstrap Error: " + e.getMessage());
        }
    }

    private void flushLogs() {
        if (logQueue.isEmpty()) {
            return;
        }

        List<InputLogEvent> batch = new ArrayList<>();
        logQueue.drainTo(batch, 100); // Send up to 100 logs at a time

        // Sort log events by timestamp (CloudWatch requires chronological order inside a batch)
        batch.sort(Comparator.comparing(InputLogEvent::timestamp));

        try {
            PutLogEventsRequest.Builder putRequestBuilder = PutLogEventsRequest.builder()
                    .logGroupName(logGroupName)
                    .logStreamName(logStreamName)
                    .logEvents(batch);

            if (sequenceToken != null) {
                putRequestBuilder.sequenceToken(sequenceToken);
            }

            PutLogEventsResponse response = cloudWatchLogsClient.putLogEvents(putRequestBuilder.build());
            sequenceToken = response.nextSequenceToken();
        } catch (DataAlreadyAcceptedException e) {
            sequenceToken = e.expectedSequenceToken();
        } catch (InvalidSequenceTokenException e) {
            sequenceToken = e.expectedSequenceToken();
            // Retry once with correct token
            try {
                PutLogEventsResponse response = cloudWatchLogsClient.putLogEvents(PutLogEventsRequest.builder()
                        .logGroupName(logGroupName)
                        .logStreamName(logStreamName)
                        .logEvents(batch)
                        .sequenceToken(sequenceToken)
                        .build());
                sequenceToken = response.nextSequenceToken();
            } catch (Exception ex) {
                System.err.println("CloudWatch Logging Retry Failed: " + ex.getMessage());
            }
        } catch (Exception e) {
            System.err.println("CloudWatch Log Upload Error: " + e.getMessage());
        }
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (customAppender != null) {
                customAppender.stop();
                LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
                Logger rootLogger = context.getLogger(Logger.ROOT_LOGGER_NAME);
                rootLogger.detachAppender(customAppender);
            }
            scheduler.shutdown();
            flushLogs(); // Flush remaining logs on exit
        } catch (Exception e) {
            System.err.println("Error cleaning up CloudWatch logs service: " + e.getMessage());
        }
    }

    private static class CustomAppender extends AppenderBase<ILoggingEvent> {
        private final BlockingQueue<InputLogEvent> queue;
        private final SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");

        public CustomAppender(BlockingQueue<InputLogEvent> queue) {
            this.queue = queue;
        }

        @Override
        protected void append(ILoggingEvent event) {
            // Prevent recursive logging loops
            if (event.getLoggerName().startsWith("software.amazon.awssdk") || 
                event.getLoggerName().contains("CloudWatchLoggingService")) {
                return;
            }

            String formattedTime = formatter.format(new Date(event.getTimeStamp()));
            String message = String.format("%s [%s] %s - %s", 
                    formattedTime, 
                    event.getThreadName(), 
                    event.getLevel().levelStr, 
                    event.getFormattedMessage());

            InputLogEvent logEvent = InputLogEvent.builder()
                    .timestamp(event.getTimeStamp())
                    .message(message)
                    .build();

            queue.offer(logEvent); // Non-blocking add to concurrent queue
        }
    }
}
