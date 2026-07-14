const bcrypt = require('bcryptjs');

const password = "HEROSKING"; // Ton mot de passe en clair
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) throw err;
    console.log("Mot de passe en clair :", password);
    console.log("Équivalent Haché (Bcrypt) :", hash);
});