# Stripe Push Provisioning
-keep class com.stripe.android.pushProvisioning.** { *; }
-keep class com.reactnativestripesdk.** { *; }
-dontwarn com.stripe.android.pushProvisioning.**
-dontwarn com.reactnativestripesdk.**

# Keycloak / OAuth2
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Dio
-keep class dio.** { *; }
-dontwarn dio.**

# Socket.io
-keep class socket_io_client.** { *; }
-dontwarn socket_io_client.**
