import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import * as jwt from "jsonwebtoken";
import { z } from "zod";

const userRepository = AppDataSource.getRepository(User);

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
});

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1h" }
        );

        res.json({ token });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName } = registerSchema.parse(req.body);
        
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Create user
        const user = new User();
        user.email = email;
        user.password = password;
        user.firstName = firstName;
        user.lastName = lastName;
        
        const savedUser = await userRepository.save(user);
        
        const token = jwt.sign(
            { userId: savedUser.id, email: savedUser.email },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1h" }
        );

        res.status(201).json({ token });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid input", errors: error.errors });
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}; 