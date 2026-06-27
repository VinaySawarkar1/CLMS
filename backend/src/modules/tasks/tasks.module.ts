import {
  Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Request, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const TASK_STATES = ['PENDING', 'ASSIGNED', 'RUNNING', 'REVIEW', 'COMPLETED'];
const ADMIN_ROLES = ['LAB_ADMIN', 'TECHNICAL_MANAGER', 'QUALITY_MANAGER'];

@Injectable()
class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(labId: string, data: { title: string; description?: string; engineerId?: string; dueDate?: string; priority?: string }) {
    return this.prisma.task.create({
      data: {
        labId,
        title: data.title,
        description: data.description,
        engineerId: data.engineerId ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.engineerId ? 'ASSIGNED' : 'PENDING',
      },
      include: { engineer: { select: { id: true, employeeCode: true, user: { select: { fullName: true } } } } },
    });
  }

  async board(labId: string, userId?: string, role?: string) {
    const isAdmin = ADMIN_ROLES.includes(role ?? '');
    const tasks = await this.prisma.task.findMany({
      where: {
        labId,
        ...(isAdmin ? {} : { engineerId: userId ?? null }),
      },
      include: { engineer: { select: { id: true, employeeCode: true, user: { select: { fullName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    const columns: Record<string, typeof tasks> = {};
    for (const state of TASK_STATES) columns[state] = [];
    for (const t of tasks) (columns[t.status] ??= []).push(t);
    return columns;
  }

  update(id: string, data: { title?: string; description?: string; dueDate?: string; engineerId?: string; status?: string }) {
    const { dueDate, engineerId, ...rest } = data;
    const updateData: any = { ...rest };
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (engineerId !== undefined) {
      updateData.engineerId = engineerId || null;
      if (engineerId && !data.status) updateData.status = 'ASSIGNED';
    }
    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: { engineer: { select: { id: true, employeeCode: true, user: { select: { fullName: true } } } } },
    });
  }

  updateStatus(id: string, status: string) {
    return this.prisma.task.update({ where: { id }, data: { status } });
  }

  remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}

@UseGuards(JwtAuthGuard)
@Controller('tasks')
class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.tasks.create(req.user.labId, body);
  }

  @Get('board')
  board(@Request() req: any) {
    return this.tasks.board(req.user.labId, req.user.sub, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.tasks.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasks.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasks.remove(id);
  }
}

@Module({
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
