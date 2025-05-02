const db = require('../db');
const bcrypt = require('bcryptjs');

class User {
    constructor(Username, Email, Phone, Password, Role) {
        this.Username = Username;
        this.Email = Email;
        this.Phone = Phone;
        this.Password = Password;
        this.Role = Role;
    }

    // Hash the password before storing
    async hashPassword() {
        this.Password = await bcrypt.hash(this.Password, 10);
    }

    // Save user to the database using named columns
    async save() {
        await this.hashPassword();

        const userObj = {
            Username: this.Username,
            Email: this.Email,
            Phone: this.Phone,
            Role: this.Role,
            Password: this.Password
        };

        console.log('Saving user to DB:', userObj); // Debug line
        await db.query('INSERT INTO User SET ?', userObj);
    }

    // Static method to find a user by email
    static async findByEmail(email) {
        const [users] = await db.query('SELECT * FROM User WHERE Email = ?', [email]);
        return users.length > 0
            ? new User(users[0].Username, users[0].Email, users[0].Phone, users[0].Password, users[0].Role)
            : null;
    }

    // Login method
    static async login(email, password) {
        const [users] = await db.query('SELECT * FROM User WHERE Email = ?', [email]);
        if (users.length === 0) return null;

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) return null;

        return new User(user.Username, user.Email, user.Phone, user.Password, user.Role);
    }
}

module.exports = User;
