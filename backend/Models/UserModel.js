const db = require('../db');
const bcrypt = require('bcryptjs');

class User {
    constructor(Username, Email, Phone, Password, Role, first_name = null, last_name = null) {
        this.Username = Username;
        this.Email = Email;
        this.Phone = Phone;
        this.Password = Password;
        this.Role = Role;
        this.first_name = first_name;
        this.last_name = last_name;
    }

    // Hash the password before storing
    async hashPassword() {
        this.Password = await bcrypt.hash(this.Password, 10);
    }

    // Save user to the database
    async save() {
        await this.hashPassword();

        const userObj = {
            Username: this.Username,
            Email: this.Email,
            Phone: this.Phone,
            Role: this.Role,
            Password: this.Password,
            first_name: this.first_name,
            last_name: this.last_name
        };

        try {
            const [result] = await db.query('INSERT INTO User SET ?', userObj);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error saving user: ${error.message}`);
        }
    }

    // Static method to find a user by email
    static async findByEmail(email) {
        try {
            const [users] = await db.query('SELECT * FROM User WHERE Email = ?', [email]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            throw new Error(`Error finding user by email: ${error.message}`);
        }
    }

    // Static method to find a user by ID
    static async findById(id) {
        try {
            const [users] = await db.query('SELECT * FROM User WHERE User_ID = ?', [id]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            throw new Error(`Error finding user by ID: ${error.message}`);
        }
    }

    // Static method to get all users
    static async findAll() {
        try {
            const [users] = await db.query(`
                SELECT 
                    User_ID, Username, first_name, last_name, Email, Phone, Role, 
                    is_active, created_at 
                FROM User 
                ORDER BY User_ID DESC
            `);
            return users;
        } catch (error) {
            throw new Error(`Error fetching all users: ${error.message}`);
        }
    }

    // Static method to update user status
    static async updateStatus(userId, isActive) {
        try {
            const [result] = await db.query('UPDATE User SET is_active = ? WHERE User_ID = ?', [isActive, userId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating user status: ${error.message}`);
        }
    }

    // Static method to verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;