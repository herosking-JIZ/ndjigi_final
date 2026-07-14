class Validators {
  Validators._();

  static bool isEmail(String email) {
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    return emailRegex.hasMatch(email.trim());
  }

  static bool isPhoneNumber(String phone) {
    // Accept phone numbers with 8-15 digits (E.164 format)
    final phoneRegex = RegExp(r'^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$');
    return phoneRegex.hasMatch(phone.replaceAll(' ', ''));
  }

  static bool isStrongPassword(String password) {
    if (password.length < 8) return false;

    final hasUppercase = password.contains(RegExp(r'[A-Z]'));
    final hasLowercase = password.contains(RegExp(r'[a-z]'));
    final hasNumbers = password.contains(RegExp(r'[0-9]'));
    final hasSpecialChars = password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));

    return hasUppercase && hasLowercase && hasNumbers && hasSpecialChars;
  }

  static bool isOtp(String otp) {
    // OTP should be 4-6 digits
    final otpRegex = RegExp(r'^\d{4,6}$');
    return otpRegex.hasMatch(otp);
  }

  static bool isUsername(String username) {
    // Username: alphanumeric and underscore, 3-20 characters
    final usernameRegex = RegExp(r'^[a-zA-Z0-9_]{3,20}$');
    return usernameRegex.hasMatch(username);
  }

  static bool isUrl(String url) {
    final urlRegex = RegExp(
      r'^(https?:\/\/)?'
      r'((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|'
      r'((\d{1,3}\.){3}\d{1,3}))'
      r'(\:\d+)?(\/[-a-z\d%_.~+]*)*'
      r'(\?[;&a-z\d%_.~+=-]*)?'
      r'(\#[-a-z\d_]*)?$',
      caseSensitive: false,
    );
    return urlRegex.hasMatch(url);
  }

  static bool isEmpty(String value) {
    return value.isEmpty || value.trim().isEmpty;
  }

  static bool isNotEmpty(String value) {
    return !isEmpty(value);
  }

  static String? validateEmail(String? value) {
    if (isEmpty(value ?? '')) {
      return 'Email est requis';
    }
    if (!isEmail(value!)) {
      return 'Email invalide';
    }
    return null;
  }

  static String? validatePhone(String? value) {
    if (isEmpty(value ?? '')) {
      return 'Numéro de téléphone est requis';
    }
    if (!isPhoneNumber(value!)) {
      return 'Numéro de téléphone invalide';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    if (isEmpty(value ?? '')) {
      return 'Mot de passe est requis';
    }
    if (value!.length < 8) {
      return 'Mot de passe doit contenir au moins 8 caractères';
    }
    return null;
  }

  static String? validateStrongPassword(String? value) {
    if (isEmpty(value ?? '')) {
      return 'Mot de passe est requis';
    }
    if (!isStrongPassword(value!)) {
      return 'Mot de passe doit contenir majuscules, minuscules, chiffres et caractères spéciaux';
    }
    return null;
  }

  static String? validateOtp(String? value) {
    if (isEmpty(value ?? '')) {
      return 'Code OTP est requis';
    }
    if (!isOtp(value!)) {
      return 'Code OTP invalide';
    }
    return null;
  }

  static String? validateUsername(String? value) {
    if (isEmpty(value ?? '')) {
      return 'Nom d\'utilisateur est requis';
    }
    if (!isUsername(value!)) {
      return 'Nom d\'utilisateur invalide (3-20 caractères, alphanumériques et _)';
    }
    return null;
  }

  static String? validateRequired(String? value) {
    if (isEmpty(value ?? '')) {
      return 'Ce champ est requis';
    }
    return null;
  }
}
