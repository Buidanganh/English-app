import { IsIn, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeSubscriptionDto {
  @ApiProperty({ example: 'PRO', description: 'Tên gói nâng cấp (PLUS hoặc PRO)' })
  @IsIn(['PLUS', 'PRO'])
  @IsNotEmpty()
  tier: 'PLUS' | 'PRO';

  @ApiProperty({ example: 1, description: 'Số tháng đăng ký (1 hoặc 12)' })
  @IsInt()
  @IsNotEmpty()
  durationMonths: number;
}
