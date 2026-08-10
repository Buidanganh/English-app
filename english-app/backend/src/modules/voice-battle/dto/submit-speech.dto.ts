import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitSpeechDto {
  @ApiProperty({ example: 'I would like an iced coffee please', description: 'Văn bản lời nói người dùng đã phát âm' })
  @IsString()
  @IsNotEmpty()
  textSpoken: string;
}
