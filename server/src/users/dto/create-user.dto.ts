export class CreateUserDto {
  email: string;
  username: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: Date;
  total_points?: number;
  level?: number;
  status?: string;
}
