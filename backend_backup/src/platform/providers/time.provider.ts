import { Injectable } from '@nestjs/common';

@Injectable()
export class TimeProvider {
  /** Returns the current UTC Date */
  now(): Date {
    return new Date();
  }

  /** Returns the current timestamp in ISO 8601 format */
  nowIso(): string {
    return new Date().toISOString();
  }

  /** Returns Unix timestamp in milliseconds */
  nowMs(): number {
    return Date.now();
  }
}
