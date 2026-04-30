import Capacitor

// Custom CAPBridgeViewController subclass that registers app-target
// plugins with the Capacitor bridge. Capacitor 8's auto-discovery only
// picks up plugins from Swift Package Manager packages; classes living
// inside the app target itself (like SignInWithApplePlugin) must be
// registered explicitly here, otherwise JS calls fail with
// "plugin is not implemented on ios".
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(SignInWithApplePlugin())
    }
}
