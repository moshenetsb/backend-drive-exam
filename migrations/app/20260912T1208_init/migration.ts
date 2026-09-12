#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a531b47716540fe7aba7497b1909b396efc1e7c7bf97c1955eec3d759de93a1f/contract';
import endContract from '../../snapshots/a531b47716540fe7aba7497b1909b396efc1e7c7bf97c1955eec3d759de93a1f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
