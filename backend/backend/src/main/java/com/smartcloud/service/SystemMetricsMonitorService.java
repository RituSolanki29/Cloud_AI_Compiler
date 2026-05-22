package com.smartcloud.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.MetricDatum;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataRequest;
import software.amazon.awssdk.services.cloudwatch.model.StandardUnit;

import java.io.File;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@EnableScheduling
@Slf4j
public class SystemMetricsMonitorService {

    private final CloudWatchClient cloudWatchClient;

    @Value("${aws.cloudwatch.namespace:SmartCloud/SystemMetrics}")
    private String namespace;

    @Scheduled(fixedRate = 60000) // Execute every 60 seconds
    public void publishMetrics() {
        try {
            // 1. Measure Free Disk Space (MB) of root mount
            File root = new File("/");
            long freeBytes = root.getUsableSpace();
            double freeMB = (double) freeBytes / (1024 * 1024);

            // 2. Measure JVM Memory Usage (%)
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            double memoryUsagePercent = ((double) usedMemory / totalMemory) * 100;

            // 3. Create CloudWatch Metric Data points
            MetricDatum diskDatum = MetricDatum.builder()
                    .metricName("FreeDiskSpaceMB")
                    .value(freeMB)
                    .unit(StandardUnit.MEGABYTES)
                    .timestamp(Instant.now())
                    .build();

            MetricDatum memoryDatum = MetricDatum.builder()
                    .metricName("JVMMemoryUsagePercent")
                    .value(memoryUsagePercent)
                    .unit(StandardUnit.PERCENT)
                    .timestamp(Instant.now())
                    .build();

            PutMetricDataRequest request = PutMetricDataRequest.builder()
                    .namespace(namespace)
                    .metricData(diskDatum, memoryDatum)
                    .build();

            cloudWatchClient.putMetricData(request);
            log.debug("Successfully published custom metrics to CloudWatch. Free Disk: {}MB, JVM Memory Usage: {}%", 
                    String.format("%.2f", freeMB), String.format("%.2f", memoryUsagePercent));
        } catch (Exception e) {
            log.error("Failed to publish system metrics to CloudWatch", e);
        }
    }
}
