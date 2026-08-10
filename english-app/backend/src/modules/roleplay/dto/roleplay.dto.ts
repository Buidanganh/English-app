import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ example: 'scenario-uuid', description: 'ID của tình huống nhập vai' })
  @IsString()
  @IsNotEmpty()
  scenarioId: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'I would like a hot Latte, please.', description: 'Tin nhắn của người dùng' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
