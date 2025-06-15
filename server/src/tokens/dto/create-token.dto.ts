export class CreateTokenDto {
  user_id: string;
  token: string;
  expires_at: Date;
}
