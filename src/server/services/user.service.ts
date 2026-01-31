import { type User, userRepository } from "../repositories";

export type SafeUser = Omit<User, "password_hash">;

function sanitizeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _, ...safeUser } = user;
  return safeUser;
}

export class UserService {
  findById(id: string): SafeUser | null {
    const user = userRepository.findById(id);
    return user ? sanitizeUser(user) : null;
  }

  findByUsername(username: string): SafeUser | null {
    const user = userRepository.findByUsername(username);
    return user ? sanitizeUser(user) : null;
  }

  getUserIdByUsername(username: string): string | null {
    const user = userRepository.findByUsername(username);
    return user?.id ?? null;
  }

  exists(username: string): boolean {
    return userRepository.usernameExists(username);
  }

  emailExists(email: string): boolean {
    return userRepository.emailExists(email);
  }
}

export const userService = new UserService();
