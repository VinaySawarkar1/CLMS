import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(labId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: { ...dto, labId } });
  }

  findAll(labId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        labId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, labId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, labId },
      include: { contacts: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, labId: string, dto: UpdateCustomerDto) {
    await this.findOne(id, labId);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(id: string, labId: string) {
    await this.findOne(id, labId);
    return this.prisma.customer.delete({ where: { id } });
  }
}
