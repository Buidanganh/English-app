import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard tùy chọn - cho phép cả user có JWT token lẫn không có token đều truy cập được.
 * Nếu có token hợp lệ thì req.user sẽ được set, nếu không có thì req.user = undefined.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Không throw lỗi nếu không có token hoặc token không hợp lệ
    return user || null;
  }
}
