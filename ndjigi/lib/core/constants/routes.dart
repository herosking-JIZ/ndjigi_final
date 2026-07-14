class Routes {
  Routes._();

  // Auth routes
  static const String splash = '/splash';
  static const String welcome = '/welcome';
  static const String login = '/login';
  static const String register = '/register';
  static const String otp = '/otp';
  static const String completeProfile = '/complete-profile';
  static const String roleSelection = '/role-selection';
  static const String documentUpload = '/document-upload';
  static const String validationAttente = '/validation-attente';
  static const String compteSuspendu = '/compte-suspendu';
  static const String keycloakCallback = '/auth/keycloak-callback';
  static const String phoneCollection = '/phone-collection';

  // Main routes
  static const String home = '/home';

  // Course routes
  static const String destinationSearch = '/course/destination-search';
  static const String mapPicker = '/course/map-picker';
  static const String vehicleSelection = '/course/vehicle-selection';
  static const String promoCode = '/course/promo-code';
  static const String courseConfirmation = '/course/confirmation';
  static const String searchingDriver = '/course/searching-driver';
  static const String driverMatching = '/course/driver-matching';
  static const String driverEnRoute = '/course/driver-en-route';
  static const String tripInProgress = '/course/in-progress';
  static const String tripSummary = '/course/summary';
  static const String rating = '/course/rating';
  static const String courseHistory = '/course/history';
  static const String chat = '/course/chat';

  // Covoiturage routes
  static const String covoiturageSearch = '/covoiturage/search';
  static const String covoiturageList = '/covoiturage/list';
  static const String covoiturageDetail = '/covoiturage/detail';
  static const String covoiturageJoin = '/covoiturage/join';
  static const String covoiturageDepart = '/covoiturage/depart';
  static const String covoiturageRating = '/covoiturage/rating';

  // Reservation routes
  static const String reservationForm = '/reservation/form';
  static const String reservationList = '/reservation/list';
  static const String reservationDetail = '/reservation/detail';
  static const String reservationConfirmation = '/reservation/confirmation';

  // Location routes
  static const String locationSearch = '/location/search';
  static const String vehicleDetail = '/location/vehicle-detail';
  static const String locationBooking = '/location/booking';
  static const String locationContract = '/location/contract';
  static const String locationActive = '/location/active';
  static const String damageReport = '/location/damage-report';

  // Payment routes
  static const String wallet = '/paiement/wallet';
  static const String recharge = '/paiement/recharge';
  static const String paymentMethod = '/paiement/payment-method';
  static const String mobileMoney = '/paiement/mobile-money';
  static const String paymentHistory = '/paiement/history';

  // Profile routes
  static const String profil = '/profil';
  static const String editProfil = '/profil/edit';
  static const String adressesFavorites = '/profil/adresses-favorites';
  static const String documents = '/profil/documents';
  static const String demandeChauffeur = '/profil/demande-chauffeur';
  static const String demandeProprietaire = '/profil/demande-proprietaire';
  static const String settings = '/profil/settings';

  // Security routes
  static const String securityCenter = '/securite/center';
  static const String sos = '/securite/sos';
  static const String tripShare = '/securite/trip-share';
  static const String driverVerification = '/securite/driver-verification';

  // Support routes
  static const String supportHome = '/support/home';
  static const String faq = '/support/faq';
  static const String newTicket = '/support/new-ticket';
  static const String ticketList = '/support/tickets';
  static const String ticketDetail = '/support/ticket-detail';
  static const String chatSupport = '/support/chat';

  // Notifications routes
  static const String notifications = '/notifications';

  // Driver routes
  static const String driverRequest = '/chauffeur/request';
  static const String driverNegotiation = '/chauffeur/negotiation';
  static const String driverNavigation = '/chauffeur/navigation';
  static const String driverEarnings = '/chauffeur/earnings';
  static const String driverHistory = '/chauffeur/history';
  static const String driverVehicle = '/chauffeur/vehicle';
  static const String chauffeurCovoiturage = '/chauffeur/covoiturage';
  static const String covoiturageJoinRequest = '/chauffeur/covoiturage-join-request';

  // Owner routes
  static const String ownerLocations = '/proprietaire/locations';
  static const String ownerLocationMap = '/proprietaire/location-map';
  static const String ownerVehicleDetail = '/proprietaire/vehicle-detail';
  static const String renterProfile = '/proprietaire/renter-profile';
}
