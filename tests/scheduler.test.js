import { jest } from '@jest/globals';
import { Scheduler } from '../dist/services/scheduler.js';

afterEach(() => {
  jest.useRealTimers();
});

test('scheduler runs task and stops interval', async () => {
  jest.useFakeTimers();
  const task = jest.fn(async () => {});
  const scheduler = new Scheduler(1000, task);

  scheduler.start();
  await Promise.resolve();
  expect(task).toHaveBeenCalledTimes(1);

  await jest.advanceTimersByTimeAsync(1000);
  expect(task).toHaveBeenCalledTimes(2);

  scheduler.stop();
  await jest.advanceTimersByTimeAsync(1000);
  expect(task).toHaveBeenCalledTimes(2);
});

test('scheduler reports task errors and continues', async () => {
  jest.useFakeTimers();
  const onError = jest.fn();
  const task = jest.fn(async () => {
    throw new Error('sync failed');
  });
  const scheduler = new Scheduler(1000, task, onError);

  scheduler.start();
  await Promise.resolve();
  expect(onError).toHaveBeenCalledTimes(1);

  await jest.advanceTimersByTimeAsync(1000);
  expect(onError).toHaveBeenCalledTimes(2);

  scheduler.stop();
});
