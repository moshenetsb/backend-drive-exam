#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/cc2ac803525f842f8ed19550ffa1a73dd61b3d416cb96030a988e2eaa7f62bcd/contract';
import startContract from '../../snapshots/cc2ac803525f842f8ed19550ffa1a73dd61b3d416cb96030a988e2eaa7f62bcd/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e1dafc692e9826fbc092adeca74736d44f39ba72df93686b5de4f4c4606f46bd/contract';
import endContract from '../../snapshots/e1dafc692e9826fbc092adeca74736d44f39ba72df93686b5de4f4c4606f46bd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
