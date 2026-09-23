#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/55c2acb1cf811c8c65ee03534c9b0845952d550a7b872399142c7feb4e032e93/contract';
import endContract from '../../snapshots/55c2acb1cf811c8c65ee03534c9b0845952d550a7b872399142c7feb4e032e93/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/703b359cbe2273ebac44a0381cb276672dba12e0a6a8e80dd7794c9fb85f1924/contract';
import startContract from '../../snapshots/703b359cbe2273ebac44a0381cb276672dba12e0a6a8e80dd7794c9fb85f1924/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
