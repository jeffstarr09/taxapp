import Capacitor
import AuthenticationServices

// Local Capacitor plugin that wraps Apple's AuthenticationServices framework
// (ASAuthorizationAppleIDProvider). We use this instead of the community
// @capacitor-community/apple-sign-in package because that package's iOS
// Swift Package is pinned to Capacitor 7 and conflicts with the rest of
// our Capacitor 8 plugins.
//
// Usage from JS:
//   const plugin = registerPlugin<SignInWithApplePlugin>("SignInWithApplePlugin");
//   const { identityToken } = await plugin.signIn({ nonce: hashedNonce });
//
// The hashed nonce is sent to Apple; the matching raw nonce is later
// verified by Supabase's signInWithIdToken when validating the JWT.

@objc(SignInWithApplePlugin)
public class SignInWithApplePlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "SignInWithApplePlugin"
    public let jsName = "SignInWithApplePlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        self.pendingCall = call
        let nonce = call.getString("nonce")

        DispatchQueue.main.async {
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.email, .fullName]
            if let nonce = nonce {
                request.nonce = nonce
            }

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        guard let call = self.pendingCall,
              let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let identityTokenData = credential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            self.pendingCall?.reject("Apple did not return a valid identity token")
            self.pendingCall = nil
            return
        }

        var result: [String: Any] = [
            "identityToken": identityToken,
            "user": credential.user
        ]

        if let authCodeData = credential.authorizationCode,
           let authCode = String(data: authCodeData, encoding: .utf8) {
            result["authorizationCode"] = authCode
        }
        if let email = credential.email {
            result["email"] = email
        }
        if let fullName = credential.fullName {
            if let givenName = fullName.givenName { result["givenName"] = givenName }
            if let familyName = fullName.familyName { result["familyName"] = familyName }
        }

        call.resolve(result)
        self.pendingCall = nil
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        let nsError = error as NSError
        if nsError.code == ASAuthorizationError.canceled.rawValue {
            self.pendingCall?.reject("canceled")
        } else {
            self.pendingCall?.reject(error.localizedDescription)
        }
        self.pendingCall = nil
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = scene.windows.first(where: { $0.isKeyWindow }) ?? scene.windows.first {
            return window
        }
        return ASPresentationAnchor()
    }
}
