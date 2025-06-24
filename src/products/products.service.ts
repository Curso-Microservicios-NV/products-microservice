import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto';
import { RpcException } from '@nestjs/microservices';


@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected ');
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.product.create({
      data: createProductDto
    });
    return product;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;

    const totalProducts = await this.product.count({ where: { available: true } });

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      data: await this.product.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: {
          available: true
        }
      }),
      meta: {
        currentPage: page,
        totalProducts,
        totalPages
      }
    }
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id, available: true }
    });

    if (!product) {
      throw new RpcException({
        message: `Product with id #${id} not found.`,
        status: HttpStatus.BAD_REQUEST
      });
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id: __, ...data } = updateProductDto;

    await this.findOne(id);

    return await this.product.update({
      where: { id },
      data: data
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Hard delete
    // return await this.product.delete({
    //   where: { id }
    // });

    // Soft delete
    const product = await this.product.update({
      where: { id },
      data: {
        available: false
      }
    });

    return product;
  }

  async validateProducts(ids: number[]) {

    const uniqueIds = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: {
        id: {
          in: uniqueIds
        }
      }
    });

    if (products.length !== uniqueIds.length) {
      throw new RpcException({
        message: 'Some products were not found',
        status: HttpStatus.BAD_REQUEST
      });
    }

    return products;
  }

}
