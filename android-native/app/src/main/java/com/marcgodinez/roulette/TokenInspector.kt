import com.marcgodinez.roulette.network.ApiClient
import io.github.jan.supabase.gotrue.auth
import kotlinx.coroutines.runBlocking

fun main() {
    runBlocking {
        val session = ApiClient.supabase.auth.currentSessionOrNull()
        if (session != null) {
            println("Current Access Token: ${session.accessToken}")
            println("User ID: ${session.user?.id}")
        } else {
            println("No active session found.")
        }
    }
}
