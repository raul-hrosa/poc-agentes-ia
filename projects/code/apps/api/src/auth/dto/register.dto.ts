import { IsEmail, IsString, IsNotEmpty, MinLength, Length } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @IsNotEmpty()
  full_name: string

  @IsString()
  @IsNotEmpty()
  crp: string

  @IsString()
  @Length(2, 2)
  state: string
}
