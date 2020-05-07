/*globals, jest, describe*/
const utils = require('../../../lib/utils');

describe('utils module', function () {
  let responseWithErrors;

  beforeEach(() => {
    responseWithErrors = {
      'statusCode': 400,
      'body': {
        'errorMessages': [],
        'errors': {
          'issue1': 'Issue1 text',
          'issue2': 'Issue2 text'
        }
      }
    };
  });

  describe('extractErrorMessages', function () {
    it('should return array of error messages, when errors exists and object', () => {
      //Arrange
      //Action
      const arrMessages = utils.extractErrorMessages(responseWithErrors);
      //Assert
      expect(arrMessages.length).toBe(Object.keys(responseWithErrors.body.errors).length);
    });

    it('should return array of error messages, when errors exists and response string', () => {
      //Arrange
      //Action
      const arrMessages = utils.extractErrorMessages(JSON.stringify(responseWithErrors));
      //Assert
      expect(arrMessages.length).toBe(Object.keys(responseWithErrors.body.errors).length);
    });

    it('should return empty array, when errors not exists', () => {
      //Arrange
      responseWithErrors.body.errors = undefined;
      //Action
      const arrMessages = utils.extractErrorMessages(responseWithErrors);
      //Assert
      expect(arrMessages.length).toBe([].length);
    });
  });
});

