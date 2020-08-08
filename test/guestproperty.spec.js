'use strict';

const { logger } = require('./helpers/logger');
const { create } = require('../lib/virtualbox');

describe('Virtualbox#guestproperty', () => {
  it('should not throw an error when getting a guest property with ostype of MacOS', (done) => {
    const executor = jest
      .fn()
      .mockReturnValueOnce(
        new Promise((resolve) =>
          resolve({ err: null, stdout: 'somevalue', stderr: '' })
        )
      )
      .mockReturnValueOnce(
        new Promise((resolve) =>
          resolve({ err: null, stdout: 'ostype="MacOS', stderr: '' })
        )
      )
      .mockReturnValueOnce(
        new Promise((resolve) =>
          resolve({
            err: null,
            stdout: 'somevalue',
            stderr: '',
          })
        )
      );
    const virtualbox = create(logger, executor);
    virtualbox.guestproperty.get(
      { vm: 'testmachine', key: 'someProperty' },
      function (value) {
        expect(value).toBeTruthy();
        expect(virtualbox.guestproperty.os_type).toBe('mac');
        done();
      }
    );
  });

  it('should not throw an error when getting a guest property with ostype of Mac OS machine', (done) => {
    const executor = jest
      .fn()
      .mockReturnValueOnce(
        new Promise((resolve) =>
          resolve({
            err: null,
            stdout: 'somevalue',
            stderr: '',
          })
        )
      )
      .mockReturnValueOnce(
        new Promise((resolve) =>
          resolve({
            err: null,
            stdout: 'ostype="Mac OS machine',
            stderr: '',
          })
        )
      )
      .mockReturnValueOnce(
        new Promise((resolve) =>
          resolve({
            err: null,
            stdout: 'somevalue',
            stderr: '',
          })
        )
      );
    const virtualbox = create(logger, executor);
    virtualbox.guestproperty.get(
      { vm: 'testmachine', key: 'someProperty' },
      function (value) {
        expect(value).toBeTruthy();
        expect(virtualbox.guestproperty.os_type).toBe('mac');
        done();
      }
    );
  });
});
