#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a531b47716540fe7aba7497b1909b396efc1e7c7bf97c1955eec3d759de93a1f/contract';
import startContract from '../../snapshots/a531b47716540fe7aba7497b1909b396efc1e7c7bf97c1955eec3d759de93a1f/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cc2ac803525f842f8ed19550ffa1a73dd61b3d416cb96030a988e2eaa7f62bcd/contract';
import endContract from '../../snapshots/cc2ac803525f842f8ed19550ffa1a73dd61b3d416cb96030a988e2eaa7f62bcd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
