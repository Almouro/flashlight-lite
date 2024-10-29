#!/usr/bin/env kotlin

import java.io.BufferedReader
import java.io.InputStreamReader

fun pollFPS(pid: String) {
    println("Stopping atrace...")
    Runtime.getRuntime().exec("adb shell atrace --async_stop").waitFor()
    println("Starting atrace...")
    ProcessBuilder("adb", "shell", "atrace", "-c", "view", "-t", "999").start()
    // This might be a different file for you!
    val adbShell = ProcessBuilder("adb", "shell", "cat", "/sys/kernel/tracing/trace_pipe").start()
    val reader = BufferedReader(InputStreamReader(adbShell.inputStream))

    var currentFrameCount = 0
    var lastPrintTime = System.currentTimeMillis()

    while (true) {
        val line = reader.readLine()
        if (line != null) {
            if (line.contains("Choreographer#doFrame") && line.contains("-$pid ")) {
                currentFrameCount++
            }
        }

        val currentTime = System.currentTimeMillis()
        if (currentTime - lastPrintTime >= 1000) {
            println(currentFrameCount)
            currentFrameCount = 0
            lastPrintTime = currentTime
        }
    }
}

val pid = args[0]
pollFPS(pid)
