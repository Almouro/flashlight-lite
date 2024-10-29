import java.util.Timer
import kotlin.concurrent.scheduleAtFixedRate

fun clearConsole() {
    print("\u001b[H\u001b[2J")
    System.out.flush()
}

fun executeCommandSync(command: String): String {
    val process = ProcessBuilder("adb", "shell", command)
        .redirectErrorStream(true)
        .start()

    val result = process.inputStream.bufferedReader().use { it.readText() }
    process.waitFor()

    return result
}

data class Measure(
    val id: String,
    val name: String,
    val totalCpuUsage: Long,
)

data class LiveMeasure(
    val name: String,
    val cpuUsageDiff: Long,
)

var previousCpuTimesByThreadId = mutableMapOf<String, Long>()

fun displayCpuMeasures(pid: String) {
    val command = "cat /proc/$pid/task/*/stat"
    val threadStats = executeCommandSync(command)

    val newMeasures = threadStats.lines()
        .filter { it.isNotEmpty() }
        .map { threadLine ->
            val columns = threadLine.split(Regex("\\s(?![^\\(]*\\))"))
            val threadPid = columns[0]
            val threadName = columns[1]
            val utime = columns[13].toLong()
            val stime = columns[14].toLong()
            val cpuTime = utime + stime
            Measure(id = threadPid, name = threadName, totalCpuUsage = cpuTime)
        }

    val liveMeasures = newMeasures.map { measure ->
        val previousCpuTime = previousCpuTimesByThreadId.get(measure.id) ?: 0
        val cpuUsageDiff = measure.totalCpuUsage - previousCpuTime
        LiveMeasure(name = measure.name, cpuUsageDiff = cpuUsageDiff)
    }

    val isFirstRun = previousCpuTimesByThreadId.isEmpty()

    if (!isFirstRun) {
        clearConsole()
        liveMeasures.sortedByDescending { it.cpuUsageDiff }.take(5).forEach { measure ->
            println("${measure.name}: ${measure.cpuUsageDiff}")
        }
    }

    newMeasures.forEach { measure ->
        previousCpuTimesByThreadId[measure.id] = measure.totalCpuUsage
    }
}

fun measureCpu(pid: String) {
    Timer().scheduleAtFixedRate(0L, 1000L) {
        displayCpuMeasures(pid)
    }
}

val pid = args[0]
measureCpu(pid)
