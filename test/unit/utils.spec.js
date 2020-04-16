const utils = require('../../lib/utils')
const fs = require('fs')
jest.mock('fs')

describe('utils module', function () {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('createDirectory', function () {
    it('should create directory, when directory not exist', () => {
      //Arrange
      fs.existsSync.mockReturnValue(false)
      //Action
      utils.createDirectory('directoryToCreate')
      //Assert
      expect(fs.mkdir).toHaveBeenCalled()
    })

    it('should not create directory, when directory exist', () => {
      //Arrange
      fs.existsSync.mockReturnValue(true)
      //Action
      utils.createDirectory('directoryToCreate')
      //Assert
      expect(fs.mkdir).not.toHaveBeenCalled()
    })
  })

  describe('deleteFile', function () {
    it('should delete file, when file exist', () => {
      //Arrange
      fs.existsSync.mockReturnValue(true)

      //Action
      utils.deleteFile('aaa/filetodelete')

      //Assert
      expect(fs.unlinkSync).toHaveBeenCalled()
      expect(fs.unlinkSync).toHaveBeenCalledWith('aaa/filetodelete')
    })

    it('should not try to delete file, when file not exist', () => {
      //Arrange
      fs.existsSync.mockReturnValue(false)

      //Action
      utils.deleteFile('aaa/filetodelete')

      //Assert
      expect(fs.unlinkSync).not.toHaveBeenCalled()
    })
  })
})

