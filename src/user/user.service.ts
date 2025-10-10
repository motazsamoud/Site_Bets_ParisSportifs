/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { createWorker } from 'tesseract.js';
import { Buffer } from 'buffer';

// Entities
import { User, UserDocument } from './entities/user.entity';
import { Token, TokenDocument } from './entities/Token.entity';
import { WalletService } from 'src/wallet/wallet.service';

// DTOs
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import {Role} from "src/user/entities/Role.enum";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
      @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
      @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
      private readonly jwtService: JwtService,
      private readonly walletService: WalletService, // ✅ injection du service wallet

  ) {}

  // ---------------------------
  // 🔹 AUTH & CREATION
  // ---------------------------

  async create(createUserDto: any): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();

    if (existingUser && existingUser.role === 'admin') {
      throw new BadRequestException('This email is already associated with a doctor account.');
    }

    let hashedPassword: string | undefined = undefined;
    if (createUserDto.password) {
      hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    } else {
      // 🔥 fallback si pas de mot de passe fourni
      hashedPassword = await bcrypt.hash('default-password', 10);
    }

    const userObject: any = {
      ...createUserDto,
      password: hashedPassword, // toujours défini
      dateOfBirth: createUserDto.dateOfBirth
          ? new Date(createUserDto.dateOfBirth) // si fourni
          : new Date(), // 🔥 fallback si pas fourni
      role: createUserDto.role,
      status: createUserDto.status ?? 'not verified',
    };

    const createdUser = new this.userModel(userObject);
    return createdUser.save();
  }


  async login(loginDto: LoginDto): Promise<{ access_token: string; user: Partial<User> }> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ $or: [{ email }, { username: email }] }).exec();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      id: user.id.toString(),
      username: user.username,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '1h' });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.tokenModel.create({
      user: user._id,
      role: user.role,
      token: access_token,
      expiresAt,
    });

    // ✅ Crée automatiquement un wallet à 0 si inexistant
    try {
      await this.walletService.getOrCreate(user.id);
      console.log(`💰 Wallet prêt pour l’utilisateur ${user.username}`);
    } catch (err) {
      console.error(`❌ Erreur création wallet pour ${user.username}:`, err);
    }

    return {
      access_token,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }



  async saveToken(userId: string, token: string, expiresAt: Date): Promise<Token> {
    return new this.tokenModel({ userId, token, expiresAt }).save();
  }

  // ---------------------------
  // 🔹 USER CRUD
  // ---------------------------

  async find(filter: any): Promise<User[]> {
    return this.userModel.find(filter);
  }

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId);
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<Partial<User>> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(id).select('-password -otp -otpExpires').exec();
    if (!user) throw new NotFoundException('User not found');

    return user.toObject();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneBy(username: string): Promise<{ id: string }> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id.toString() };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userModel.findById(id).exec();
    if (!existingUser) throw new NotFoundException('User not found');

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    } else {
      delete updateUserDto.password;
    }

    const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true, runValidators: true })
        .exec();

    if (!updatedUser) throw new NotFoundException('User not found');
    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) throw new NotFoundException('User not found');
    return deletedUser;
  }

  // ---------------------------
  // 🔹 PASSWORD & SECURITY
  // ---------------------------

  async forgetPassword(dto: ForgotPasswordDto): Promise<void> {
    const { email } = dto;
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');

    const tempPassword = this.generateStrongPassword(10);
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    user.password = hashedTempPassword;
    await user.save();

    await this.sendEmail(email, 'Your Temporary Password', `Your temporary password is: ${tempPassword}`);
  }

  async verifyTempPassword(email: string, tempPassword: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(tempPassword, user.password);
    if (!isPasswordValid) throw new BadRequestException('Invalid temporary password');

    return true;
  }

  async updatePassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { userId, newPassword } = dto;
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    const filter = this.buildUserFilter(userId);
    const user = await this.userModel.findOneAndUpdate(filter, { $set: { password: hashedNewPassword } }, { new: true });

    if (!user) throw new NotFoundException('User not found');

    await this.sendEmail(user.email, 'Password Updated', 'Your password has been updated.');
    return { message: 'Password updated successfully.' };
  }
  async checkStatus(identifier: string): Promise<{ status: string }> {
    const user = await this.userModel.findOne({ email: identifier }).exec();
    if (!user) throw new NotFoundException('User not found');
    return { status: user.status };
  }

  // ---------------------------
  // 🔹 OTP MANAGEMENT
  // ---------------------------

  async sendOtpToUser(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.sendEmail(email, 'Your OTP', `Your OTP is: ${otp}`);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(identifier: string, otp: string, sendTemporaryPassword = false): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findOne({ email: identifier }).exec();
    if (!user) throw new NotFoundException('User not found');

    if (user.otp !== otp || (user.otpExpires && user.otpExpires < new Date())) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    user.status = 'verified';
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    if (sendTemporaryPassword) {
      await this.forgetPassword({ email: identifier });
      return { success: true, message: 'OTP verified. Temporary password sent.' };
    }

    return { success: true, message: 'OTP verified successfully.' };
  }

  async resendOtp(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');

    await this.sendOtpToUser(email);
  }

  // ---------------------------
  // 🔹 TOKEN MANAGEMENT
  // ---------------------------

  async validateToken(token: string): Promise<boolean> {
    const storedToken = await this.tokenModel.findOne({ token }).exec();
    if (!storedToken) throw new NotFoundException('Token not found');
    if (storedToken.expiresAt < new Date()) throw new BadRequestException('Token expired');
    return true;
  }

  async logout(token: string): Promise<void> {
    const result = await this.tokenModel.findOneAndDelete({ token }).exec();
    if (!result) throw new NotFoundException('Token not found or already invalidated');
  }

  getUserIdFromToken(token: string): string | null {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded?.id?.toString() || null;
    } catch {
      return null;
    }
  }

  // ---------------------------
  // 🔹 DIPLOMA VERIFICATION
  // ---------------------------

  async verifyDiploma(imageBase64: string, lang: string): Promise<{ verified: boolean; extractedText: string }> {
    const worker = await createWorker();
    await worker.load();
    await worker.reinitialize(lang);

    const buffer = Buffer.from(imageBase64, 'base64');
    const { data: { text } } = await worker.recognize(buffer);

    await worker.terminate();

    const loweredText = text.toLowerCase();
    const keywords = ['diplôme', 'université', 'faculté', 'doctorat', 'licence', 'master'];
    const isDiploma = keywords.some(word => loweredText.includes(word));

    return { verified: isDiploma, extractedText: loweredText };
  }

  // ---------------------------
  // 🔹 HELPERS
  // ---------------------------

  private buildUserFilter(identifier: string) {
    return Types.ObjectId.isValid(identifier)
        ? { _id: new Types.ObjectId(identifier) }
        : { email: identifier.trim().toLowerCase() };
  }

  private generateStrongPassword(length: number): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const allChars = upper + lower + digits;

    let password = '';
    password += this.getRandomCharacter(upper);
    password += this.getRandomCharacter(lower);
    password += this.getRandomCharacter(digits);

    for (let i = 3; i < length; i++) password += this.getRandomCharacter(allChars);
    return this.shuffle(password);
  }

  private getRandomCharacter(chars: string): string {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  private shuffle(password: string): string {
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  private async sendEmail(to: string, subject: string, content: string): Promise<void> {
    const brevoUrl = 'https://api.brevo.com/v3/smtp/email';
    const emailData = {
      sender: { name: 'Esprit', email: 'noreply@esprit.tn' },
      to: [{ email: to }],
      subject,
      htmlContent: `<p>${content}</p>`,
    };

    try {
      await axios.post(brevoUrl, emailData, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY as string,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send email', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  // PATCH /user/:id/role
  async updateRole(id: string, role: Role): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    return user.save();
  }

// PATCH /user/:id/status
  async updateStatus(id: string, status: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    user.status = status;
    return user.save();
  }

// PATCH /user/:id/profile
  async updateProfile(id: string, profileData: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
        id,
        { $set: profileData },
        { new: true, runValidators: true },
    ).exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

// PATCH /user/:id/add-portfolio
  async addPortfolio(id: string, project: { titre: string; lien?: string; description?: string }) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    if (!(user as any).portfolio) (user as any).portfolio = [];
    (user as any).portfolio.push(project);

    return user.save();
  }

}
