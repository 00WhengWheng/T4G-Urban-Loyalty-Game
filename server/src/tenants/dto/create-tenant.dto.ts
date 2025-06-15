export class CreateTenantDto {
  business_name: string;
  owner_name?: string;
  email: string;
  password_hash: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  business_type?: string;
  logo_url?: string;
  description?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  status?: string;
}
