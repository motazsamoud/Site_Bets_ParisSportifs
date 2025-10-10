import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Req,
  UseGuards,
  NotFoundException,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { User } from './entities/user.entity';
import { Request } from 'express';
import { Role } from 'src/user/entities/Role.enum';
import { JwtService } from '@nestjs/jwt';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService,
              private readonly jwtService: JwtService,) {}

  // --- CRUD de base ---

  @Get('get')
  async findAllUsers(@Headers() headers: Record<string, string | undefined>) {
    const token = headers.authorization?.replace('Bearer ', '');
    if (!token) throw new ForbiddenException('Token manquant');

    try {
      const decoded = this.jwtService.verify(token);
      if (decoded.role !== 'admin') throw new ForbiddenException('Accès refusé');
    } catch (e) {
      throw new ForbiddenException('Token invalide');
    }

    return this.userService.findAllUsers();
  }

  @Post('signup')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('find-by-email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.userService.findByEmail(email); // ✅ corrigé
    if (!user) throw new NotFoundException('User not found');
    return user;
  }


  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  // --- OTP / Auth ---

  @Post('send-otp')
  async sendOtp(@Body('email') email: string) {
    await this.userService.sendOtpToUser(email);
    return { message: 'OTP sent successfully' };
  }

  @Post('verify-otp')
  async verifyOtp(
      @Body()
          body: { identifier: string; otp: string; sendTemporaryPassword?: boolean },
  ) {
    const { identifier, otp, sendTemporaryPassword = false } = body;
    const result = await this.userService.verifyOtp(
        identifier,
        otp,
        sendTemporaryPassword,
    );
    if (!result.success) throw new BadRequestException(result.message);
    return { message: result.message };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) throw new BadRequestException('Token is required');
    await this.userService.logout(token);
    return { message: 'Logged out successfully' };
  }

  @Post('resend-otp')
  async resendOtp(@Body('email') email: string) {
    await this.userService.resendOtp(email);
    return { message: 'OTP resent successfully' };
  }

  // --- Update / Delete ---

  @Patch('update')
  async update(@Body('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    if (!id) throw new BadRequestException('ID is required');
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // --- Password management ---

  @Post('forget-password')
  async forgetPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.userService.forgetPassword(forgotPasswordDto);
    return { message: '✅ Temporary password sent to email.' };
  }

  @Post('verify-temp-password')
  async verifyTempPassword(
      @Body('email') email: string,
      @Body('tempPassword') tempPassword: string,
  ) {
    const isValid = await this.userService.verifyTempPassword(
        email,
        tempPassword,
    );
    if (!isValid) throw new BadRequestException('Invalid temporary password');
    return { success: true, message: 'Temporary password is valid.' };
  }

  @Patch('update-password')
  async updatePassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.updatePassword(
        resetPasswordDto
    );
  }

  // --- Divers ---

  @Post('status')
  async checkStatus(@Body('identifier') identifier: string) {
    return this.userService.checkStatus(identifier);
  }

  @Post('verify-diploma')
  async verifyDiploma(@Body() body: { imageBase64: string; lang: string }) {
    return this.userService.verifyDiploma(body.imageBase64, body.lang);
  }

  @Post(':id')
  async findById(@Param('id') id: string): Promise<User> {
    return this.userService.findByIdOrThrow(id);
  }
  // --- Roles ---
  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body('role') role: Role) {
    if (!role) throw new BadRequestException('Role is required');
    return this.userService.updateRole(id, role);
  }

// --- Status ---
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    if (!status) throw new BadRequestException('Status is required');
    return this.userService.updateStatus(id, status);
  }

// --- Profile ---
  @Patch(':id/profile')
  async updateProfile(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateProfile(id, updateUserDto);
  }

// --- Portfolio ---
  @Patch(':id/add-portfolio')
  async addPortfolio(
      @Param('id') id: string,
      @Body() body: { titre: string; lien?: string; description?: string },
  ) {
    return this.userService.addPortfolio(id, body);
  }

}
