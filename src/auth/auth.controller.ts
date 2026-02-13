import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Routes, Services } from 'src/utils/types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// @Controller(Routes.AUTH)
// export class AuthController {
//   constructor(@Inject(Services.AUTH) private authService: AuthService) {}
// }
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Реєстрація нового користувача' })
  @ApiResponse({ status: 201, description: 'Користувач успішно створений' })
  @ApiResponse({ status: 400, description: 'Такий email вже існує' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Авторізація користувача' })
  @ApiResponse({
    status: 200,
    description: 'Повертає access и refresh токены',
  })
  @ApiResponse({ status: 401, description: 'Невірний email чи пароль' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (user instanceof UnauthorizedException) {
      throw user;
    }
    return this.authService.login({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  @Post('refresh')
  async resfreshToken(@Body('resfreshToken') resfreshToken: string) {
    const payload = this.authService.verifyToken(resfreshToken);
    if (payload instanceof UnauthorizedException) {
      throw payload;
    }
    const user = await this.authService.fintUserById(payload.sub);

    if (user instanceof UnauthorizedException) {
      throw user;
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.authService.login({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
