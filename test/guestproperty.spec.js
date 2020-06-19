'use strict';

const virtualbox = require('../lib/virtualbox'),
  args = process.argv.slice(2);

jest.mock('child_process');

describe('Virtualbox#guestproperty', () => {
  afterEach(() => {
    virtualbox.guestproperty.os_type = null;
  });
  it('should not throw an error when getting a guest property with ostype of MacOS', (done) => {
    const { execFile } = require('child_process');
    execFile
      .mockImplementationOnce((_, __, callback) => {
        callback(null, 'ostype="MacOS', '');
      })
      .mockImplementationOnce((_, __, callback) => {
        callback(null, 'somevalue', '');
      });
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
    const { execFile } = require('child_process');
    execFile
      .mockImplementationOnce((_, __, callback) => {
        callback(null, 'ostype="Mac OS machine', '');
      })
      .mockImplementationOnce((_, __, callback) => {
        callback(null, 'somevalue', '');
      });
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
