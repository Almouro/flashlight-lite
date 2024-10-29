import java.io.BufferedReader
import java.io.InputStreamReader
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

fun displayCpuMeasures(pid: String) {
    val command = "cat /proc/$pid/task/*/stat"
    val threadStats = executeCommandSync(command)

    println(threadStats)
}

val pid = args[0]
displayCpuMeasures(pid)

// Continue this implementation!
