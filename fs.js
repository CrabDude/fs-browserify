// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// Maintainers, keep in mind that octal literals are not allowed
// in strict mode. Use the decimal value and add a comment with
// the octal value. Example:
//
//   var mode = 438; /* mode=0666 */

console.log('fs');

var util = require('util');
var Buffer = require('buffer').Buffer;
var pathModule = require('path');

// start filer.js

var self = window; // window or worker context.

self.URL = self.URL || self.webkitURL;
self.requestFileSystem = self.requestFileSystem || self.webkitRequestFileSystem;
self.resolveLocalFileSystemURL = self.resolveLocalFileSystemURL ||
                                 self.webkitResolveLocalFileSystemURL;
self.storageInfo = self.storageInfo || self.webkitStorageInfo;
self.BlobBuilder = self.BlobBuilder || self.MozBlobBuilder ||
                   self.WebKitBlobBuilder;

// Prevent errors in browsers that don't support FileError.
if (self.FileError === undefined) {
  var FileError = function() {};
  FileError.prototype.prototype = Error.prototype;
} else {
	var FileError = self.FileError;
}

var MyFileError = function(obj) {
  this.prototype = FileError.prototype;
  this.code = obj.code;
  this.name = obj.name;
};


var FS_INIT_ERROR_MSG = 'Filesystem has not been initialized.';
var NOT_IMPLEMENTED_MSG = 'Not implemented.';
var NOT_A_DIRECTORY = 'Path was not a directory.';
var INCORRECT_ARGS = 'These method arguments are not supported.';
var FS_URL_SCHEME = 'filesystem:';
var DEFAULT_FS_SIZE = 1024 * 1024; // 1MB.

var fs_ = null;
var cwd_ = null;
var isOpen_ = false;

//MyFileError.prototype.__proto__ = FileError.prototype;

// Extend FileError with custom errors and a convenience method to get error
// code mnemonic.
FileError.BROWSER_NOT_SUPPORTED = 1000;

// TODO: remove when FileError.name is implemented (crbug.com/86014).
FileError.prototype.__defineGetter__('name', function() {
  var keys = Object.keys(FileError);
  for (var i = 0, key; key = keys[i]; ++i) {
    if (FileError[key] == this.code) {
      return key;
    }
  }
  return 'Unknown Error';
});


// end filer.js

var binding = {
	'init': function(opt_initObj, opt_successCallback, opt_errorHandler) {
    if (!self.requestFileSystem) {
      throw new MyFileError({
        code: FileError.BROWSER_NOT_SUPPORTED,
        name: 'BROWSER_NOT_SUPPORTED'
      });
    }

    var initObj = opt_initObj ? opt_initObj : {}; // Use defaults if obj is null.

    var size = initObj.size || DEFAULT_FS_SIZE;
    this.type = self.TEMPORARY;
    if ('persistent' in initObj && initObj.persistent) {
      this.type = self.PERSISTENT;
    }

    var init = function(fs) {
      this.size = size;
      fs_ = fs;
      cwd_ = fs_.root;
      isOpen_ = true;

      opt_successCallback && opt_successCallback(fs);
    };
    
    if (this.type == self.PERSISTENT) {
      self.webkitStorageInfo.requestQuota(this.type, size, function(grantedBytes) {
        self.requestFileSystem(this.type, grantedBytes, init.bind(this), opt_errorHandler);
      }.bind(this), opt_errorHandler);
    } else {
      self.requestFileSystem(this.type, size, init.bind(this), opt_errorHandler);
    }
  },
	'Stats': function() {},
  'close': function() {},
  'open': function(path, flags, mode, callback) {
    console.log('open', arguments);

  	!this.isOpen_ ? this.init(null, onInit) : onInit()

    function onInit(filesystem) {
      console.log('initialized');
	  	filesystem.root.getFile(path, {create: true}, function(entry) {
        console.log('Opened: ', path)
	  		callback(null, entry);
	  	})
    }
  },
  'read': function() {}, //*
  'fdatasync': function() {},
  'fsync': function() {},
  'rename': function() {},
  'truncate': function() {},
  'rmdir': function() {},
  'mkdir': function() {},
  'sendfile': function() {},
  'readdir': function() {},
  'stat': function() {},
  'lstat': function() {},
  'fstat': function() {},
  'link': function() {},
  'symlink': function() {},
  'readlink': function() {},
  'unlink': function() {},
  'write': function(fd, buffer, offset, length, position, wrapper) {
    console.log('write', arguments);

  	!this.isOpen_ ? this.init(null, onInit) : onInit();

    function onInit(filesystem) {
	    fd.createWriter(function(fileWriter) {

	      fileWriter.onerror = wrapper;

        fileWriter.onwriteend = function(e) {
        	var written = buffer.length;
        	// determine if it was a succesful write
          wrapper(null, written, buffer);
        };

	      var bb = new BlobBuilder();
	      bb.append(buffer.toString());
	      fileWriter.write(bb.getBlob());
	    }, wrapper);
	  }
  },
  'chmod': function() {},
  'fchmod': function() {},
  'chown': function() {},
  'fchown': function() {},
  'utimes': function() {},
  'futimes': function() {},
  'StatWatcher': function() {}
}; //process.binding('fs');
var constants = {
	O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  S_IFMT: 61440,
  S_IFREG: 32768,
  S_IFDIR: 16384,
  S_IFCHR: 8192,
  S_IFBLK: 24576,
  S_IFIFO: 4096,
  S_IFLNK: 40960,
  S_IFSOCK: 49152,
  O_CREAT: 512,
  O_EXCL: 2048,
  O_NOCTTY: 131072,
  O_TRUNC: 1024,
  O_APPEND: 8,
  O_DIRECTORY: 1048576,
  O_NOFOLLOW: 256,
  O_SYNC: 128,
  O_SYMLINK: 2097152
}; //process.binding('constants');
var fs = exports;
var Stream = require('stream').Stream;
var EventEmitter = require('events').EventEmitter;

var kMinPoolSpace = 128;
var kPoolSize = 40 * 1024;

var O_APPEND = constants.O_APPEND || 0;
var O_CREAT = constants.O_CREAT || 0;
var O_DIRECTORY = constants.O_DIRECTORY || 0;
var O_EXCL = constants.O_EXCL || 0;
var O_NOCTTY = constants.O_NOCTTY || 0;
var O_NOFOLLOW = constants.O_NOFOLLOW || 0;
var O_RDONLY = constants.O_RDONLY || 0;
var O_RDWR = constants.O_RDWR || 0;
var O_SYMLINK = constants.O_SYMLINK || 0;
var O_SYNC = constants.O_SYNC || 0;
var O_TRUNC = constants.O_TRUNC || 0;
var O_WRONLY = constants.O_WRONLY || 0;

fs.Stats = binding.Stats;

fs.Stats.prototype._checkModeProperty = function(property) {
  return ((this.mode & constants.S_IFMT) === property);
};

fs.Stats.prototype.isDirectory = function() {
  return this._checkModeProperty(constants.S_IFDIR);
};

fs.Stats.prototype.isFile = function() {
  return this._checkModeProperty(constants.S_IFREG);
};

fs.Stats.prototype.isBlockDevice = function() {
  return this._checkModeProperty(constants.S_IFBLK);
};

fs.Stats.prototype.isCharacterDevice = function() {
  return this._checkModeProperty(constants.S_IFCHR);
};

fs.Stats.prototype.isSymbolicLink = function() {
  return this._checkModeProperty(constants.S_IFLNK);
};

fs.Stats.prototype.isFIFO = function() {
  return this._checkModeProperty(constants.S_IFIFO);
};

fs.Stats.prototype.isSocket = function() {
  return this._checkModeProperty(constants.S_IFSOCK);
};

fs.exists = function(path, callback) {
  binding.stat(path, function(err, stats) {
    if (callback) callback(err ? false : true);
  });
};

fs.existsSync = function(path) {
  try {
    binding.stat(path);
    return true;
  } catch (e) {
    return false;
  }
};

fs.readFile = function(path, encoding_) {
  var encoding = typeof(encoding_) === 'string' ? encoding_ : null;
  var callback = arguments[arguments.length - 1];
  if (typeof(callback) !== 'function') callback = noop;

  // first, stat the file, so we know the size.
  var size;
  var buffer;
  var pos = 0;
  var fd;

  fs.open(path, constants.O_RDONLY, 438 /*=0666*/, function(er, fd_) {
    if (er) return callback(er);
    fd = fd_;

    fs.fstat(fd, function(er, st) {
      if (er) return callback(er);
      size = st.size;
      if (size === 0) {
        buffer = new Buffer(0);
        return afterRead(null, 0);
      }

      buffer = new Buffer(size);
      read();
    });
  });

  function read() {
    fs.read(fd, buffer, pos, size - pos, pos, afterRead);
  }

  function afterRead(er, bytesRead) {
    if (er) {
      return fs.close(fd, function(er2) {
        return callback(er);
      });
    }

    pos += bytesRead;
    if (pos === size) close();
    else read();
  }

  function close() {
    fs.close(fd, function(er) {
      if (encoding) buffer = buffer.toString(encoding);
      return callback(er, buffer);
    });
  }
};

fs.readFileSync = function(path, encoding) {
  var fd = fs.openSync(path, constants.O_RDONLY, 438 /*=0666*/);

  var size;
  var threw = true;
  try {
    size = fs.fstatSync(fd).size;
    threw = false;
  } finally {
    if (threw) fs.closeSync(fd);
  }

  if (size === 0) {
    fs.closeSync(fd);
    return encoding ? '' : new Buffer(0);
  }

  var buffer = new Buffer(size);
  var pos = 0;

  while (pos < size) {
    var threw = true;
    try {
      var bytesRead = fs.readSync(fd, buffer, pos, size - pos, pos);
      threw = false;
    } finally {
      if (threw) fs.closeSync(fd);
    }

    pos += bytesRead;
  }

  fs.closeSync(fd);

  if (encoding) buffer = buffer.toString(encoding);
  return buffer;
};


// Used by binding.open and friends
function stringToFlags(flag) {
  // Only mess with strings
  if (typeof flag !== 'string') {
    return flag;
  }

  // O_EXCL is mandated by POSIX, Windows supports it too.
  // Let's add a check anyway, just in case.
  if (!O_EXCL && ~flag.indexOf('x')) {
    throw errnoException('ENOSYS', 'fs.open(O_EXCL)');
  }

  switch (flag) {
    case 'r' : return O_RDONLY;
    case 'rs' : return O_RDONLY | O_SYNC;
    case 'r+' : return O_RDWR;
    case 'rs+' : return O_RDWR | O_SYNC;

    case 'w' : return O_TRUNC | O_CREAT | O_WRONLY;
    case 'wx' : // fall through
    case 'xw' : return O_TRUNC | O_CREAT | O_WRONLY | O_EXCL;

    case 'w+' : return O_TRUNC | O_CREAT | O_RDWR;
    case 'wx+': // fall through
    case 'xw+': return O_TRUNC | O_CREAT | O_RDWR | O_EXCL;

    case 'a' : return O_APPEND | O_CREAT | O_WRONLY;
    case 'ax' : // fall through
    case 'xa' : return O_APPEND | O_CREAT | O_WRONLY | O_EXCL;

    case 'a+' : return O_APPEND | O_CREAT | O_RDWR;
    case 'ax+': // fall through
    case 'xa+': return O_APPEND | O_CREAT | O_RDWR | O_EXCL;
  }

  throw new Error('Unknown file open flag: ' + flag);
}

// exported but hidden, only used by test/simple/test-fs-open-flags.js
Object.defineProperty(exports, '_stringToFlags', {
  enumerable: false,
  value: stringToFlags
});

function noop() {}

// Yes, the follow could be easily DRYed up but I provide the explicit
// list to make the arguments clear.

fs.close = function(fd, callback) {
  binding.close(fd, callback || noop);
};

fs.closeSync = function(fd) {
  return binding.close(fd);
};

function modeNum(m, def) {
  switch (typeof m) {
    case 'number': return m;
    case 'string': return parseInt(m, 8);
    default:
      if (def) {
        return modeNum(def);
      } else {
        return undefined;
      }
  }
}

fs.open = function(path, flags, mode, callback) {
  callback = arguments[arguments.length - 1];
  if (typeof(callback) !== 'function') {
    callback = noop;
  }

  mode = modeNum(mode, 438 /*=0666*/);

  binding.open(pathModule._makeLong(path),
               stringToFlags(flags),
               mode,
               callback);
};

fs.openSync = function(path, flags, mode) {
  mode = modeNum(mode, 438 /*=0666*/);
  return binding.open(pathModule._makeLong(path), stringToFlags(flags), mode);
};

fs.read = function(fd, buffer, offset, length, position, callback) {
  if (!Buffer.isBuffer(buffer)) {
    // legacy string interface (fd, length, position, encoding, callback)
    var cb = arguments[4],
        encoding = arguments[3];
    position = arguments[2];
    length = arguments[1];
    buffer = new Buffer(length);
    offset = 0;

    callback = function(err, bytesRead) {
      if (!cb) return;

      var str = (bytesRead > 0) ? buffer.toString(encoding, 0, bytesRead) : '';

      (cb)(err, str, bytesRead);
    };
  }

  function wrapper(err, bytesRead) {
    // Retain a reference to buffer so that it can't be GC'ed too soon.
    callback && callback(err, bytesRead || 0, buffer);
  }

  binding.read(fd, buffer, offset, length, position, wrapper);
};

fs.readSync = function(fd, buffer, offset, length, position) {
  var legacy = false;
  if (!Buffer.isBuffer(buffer)) {
    // legacy string interface (fd, length, position, encoding, callback)
    legacy = true;
    var encoding = arguments[3];
    position = arguments[2];
    length = arguments[1];
    buffer = new Buffer(length);

    offset = 0;
  }

  var r = binding.read(fd, buffer, offset, length, position);
  if (!legacy) {
    return r;
  }

  var str = (r > 0) ? buffer.toString(encoding, 0, r) : '';
  return [str, r];
};

fs.write = function(fd, buffer, offset, length, position, callback) {
  if (!Buffer.isBuffer(buffer)) {
    // legacy string interface (fd, data, position, encoding, callback)
    callback = arguments[4];
    position = arguments[2];

    buffer = new Buffer('' + arguments[1], arguments[3]);
    offset = 0;
    length = buffer.length;
  }

  if (!length) {
    if (typeof callback == 'function') {
      process.nextTick(function() {
        callback(undefined, 0);
      });
    }
    return;
  }

  function wrapper(err, written) {
    // Retain a reference to buffer so that it can't be GC'ed too soon.
    callback && callback(err, written || 0, buffer);
  }

  binding.write(fd, buffer, offset, length, position, wrapper);
};

fs.writeSync = function(fd, buffer, offset, length, position) {
  if (!Buffer.isBuffer(buffer)) {
    // legacy string interface (fd, data, position, encoding)
    position = arguments[2];

    buffer = new Buffer('' + arguments[1], arguments[3]);
    offset = 0;
    length = buffer.length;
  }
  if (!length) return 0;

  return binding.write(fd, buffer, offset, length, position);
};

fs.rename = function(oldPath, newPath, callback) {
  binding.rename(pathModule._makeLong(oldPath),
                 pathModule._makeLong(newPath),
                 callback || noop);
};

fs.renameSync = function(oldPath, newPath) {
  return binding.rename(pathModule._makeLong(oldPath),
                        pathModule._makeLong(newPath));
};

fs.truncate = function(fd, len, callback) {
  binding.truncate(fd, len, callback || noop);
};

fs.truncateSync = function(fd, len) {
  return binding.truncate(fd, len);
};

fs.rmdir = function(path, callback) {
  binding.rmdir(pathModule._makeLong(path), callback || noop);
};

fs.rmdirSync = function(path) {
  return binding.rmdir(pathModule._makeLong(path));
};

fs.fdatasync = function(fd, callback) {
  binding.fdatasync(fd, callback || noop);
};

fs.fdatasyncSync = function(fd) {
  return binding.fdatasync(fd);
};

fs.fsync = function(fd, callback) {
  binding.fsync(fd, callback || noop);
};

fs.fsyncSync = function(fd) {
  return binding.fsync(fd);
};

fs.mkdir = function(path, mode, callback) {
  if (typeof mode === 'function') callback = mode;
  binding.mkdir(pathModule._makeLong(path), modeNum(mode, 511 /*=0777*/),
                callback || noop);
};

fs.mkdirSync = function(path, mode) {
  return binding.mkdir(pathModule._makeLong(path),
                       modeNum(mode, 511 /*=0777*/));
};

fs.sendfile = function(outFd, inFd, inOffset, length, callback) {
  binding.sendfile(outFd, inFd, inOffset, length, callback || noop);
};

fs.sendfileSync = function(outFd, inFd, inOffset, length) {
  return binding.sendfile(outFd, inFd, inOffset, length);
};

fs.readdir = function(path, callback) {
  binding.readdir(pathModule._makeLong(path), callback || noop);
};

fs.readdirSync = function(path) {
  return binding.readdir(pathModule._makeLong(path));
};

fs.fstat = function(fd, callback) {
  binding.fstat(fd, callback || noop);
};

fs.lstat = function(path, callback) {
  binding.lstat(pathModule._makeLong(path), callback || noop);
};

fs.stat = function(path, callback) {
  binding.stat(pathModule._makeLong(path), callback || noop);
};

fs.fstatSync = function(fd) {
  return binding.fstat(fd);
};

fs.lstatSync = function(path) {
  return binding.lstat(pathModule._makeLong(path));
};

fs.statSync = function(path) {
  return binding.stat(pathModule._makeLong(path));
};

fs.readlink = function(path, callback) {
  binding.readlink(pathModule._makeLong(path), callback || noop);
};

fs.readlinkSync = function(path) {
  return binding.readlink(pathModule._makeLong(path));
};

fs.symlink = function(destination, path, type_, callback) {
  var type = (typeof(type_) == 'string' ? type_ : null);
  var callback_ = arguments[arguments.length - 1];
  callback = (typeof(callback_) == 'function' ? callback_ : null);
  binding.symlink(pathModule._makeLong(destination),
                  pathModule._makeLong(path), type, callback);
};

fs.symlinkSync = function(destination, path, type) {
  return binding.symlink(pathModule._makeLong(destination),
                         pathModule._makeLong(path), type);
};

fs.link = function(srcpath, dstpath, callback) {
  binding.link(pathModule._makeLong(srcpath),
               pathModule._makeLong(dstpath),
               callback || noop);
};

fs.linkSync = function(srcpath, dstpath) {
  return binding.link(pathModule._makeLong(srcpath),
                      pathModule._makeLong(dstpath));
};

fs.unlink = function(path, callback) {
  binding.unlink(pathModule._makeLong(path), callback || noop);
};

fs.unlinkSync = function(path) {
  return binding.unlink(pathModule._makeLong(path));
};

fs.fchmod = function(fd, mode, callback) {
  binding.fchmod(fd, modeNum(mode), callback || noop);
};

fs.fchmodSync = function(fd, mode) {
  return binding.fchmod(fd, modeNum(mode));
};

if (constants.hasOwnProperty('O_SYMLINK')) {
  fs.lchmod = function(path, mode, callback) {
    callback = callback || noop;
    fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, function(err, fd) {
      if (err) {
        callback(err);
        return;
      }
      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      fs.fchmod(fd, mode, function(err) {
        fs.close(fd, function(err2) {
          callback(err || err2);
        });
      });
    });
  };

  fs.lchmodSync = function(path, mode) {
    var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK);

    // prefer to return the chmod error, if one occurs,
    // but still try to close, and report closing errors if they occur.
    var err, err2;
    try {
      var ret = fs.fchmodSync(fd, mode);
    } catch (er) {
      err = er;
    }
    try {
      fs.closeSync(fd);
    } catch (er) {
      err2 = er;
    }
    if (err || err2) throw (err || err2);
    return ret;
  };
}


fs.chmod = function(path, mode, callback) {
  binding.chmod(pathModule._makeLong(path), modeNum(mode), callback || noop);
};

fs.chmodSync = function(path, mode) {
  return binding.chmod(pathModule._makeLong(path), modeNum(mode));
};

if (constants.hasOwnProperty('O_SYMLINK')) {
  fs.lchown = function(path, uid, gid, callback) {
    callback = callback || noop;
    fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, function(err, fd) {
      if (err) {
        callback(err);
        return;
      }
      fs.fchown(fd, uid, gid, callback);
    });
  };

  fs.lchownSync = function(path, uid, gid) {
    var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK);
    return fs.fchownSync(fd, uid, gid);
  };
}

fs.fchown = function(fd, uid, gid, callback) {
  binding.fchown(fd, uid, gid, callback || noop);
};

fs.fchownSync = function(fd, uid, gid) {
  return binding.fchown(fd, uid, gid);
};

fs.chown = function(path, uid, gid, callback) {
  binding.chown(pathModule._makeLong(path), uid, gid, callback || noop);
};

fs.chownSync = function(path, uid, gid) {
  return binding.chown(pathModule._makeLong(path), uid, gid);
};

// converts Date or number to a fractional UNIX timestamp
function toUnixTimestamp(time) {
  if (typeof time == 'number') {
    return time;
  }
  if (time instanceof Date) {
    // convert to 123.456 UNIX timestamp
    return time.getTime() / 1000;
  }
  throw new Error('Cannot parse time: ' + time);
}

// exported for unit tests, not for public consumption
fs._toUnixTimestamp = toUnixTimestamp;

fs.utimes = function(path, atime, mtime, callback) {
  atime = toUnixTimestamp(atime);
  mtime = toUnixTimestamp(mtime);
  binding.utimes(pathModule._makeLong(path), atime, mtime, callback || noop);
};

fs.utimesSync = function(path, atime, mtime) {
  atime = toUnixTimestamp(atime);
  mtime = toUnixTimestamp(mtime);
  binding.utimes(pathModule._makeLong(path), atime, mtime);
};

fs.futimes = function(fd, atime, mtime, callback) {
  atime = toUnixTimestamp(atime);
  mtime = toUnixTimestamp(mtime);
  binding.futimes(fd, atime, mtime, callback || noop);
};

fs.futimesSync = function(fd, atime, mtime) {
  atime = toUnixTimestamp(atime);
  mtime = toUnixTimestamp(mtime);
  binding.futimes(fd, atime, mtime);
};

function writeAll(fd, buffer, offset, length, position, callback) {
  var callback_ = arguments[arguments.length - 1];
  callback = (typeof(callback_) == 'function' ? callback_ : null);

  // write(fd, buffer, offset, length, position, callback)
  fs.write(fd, buffer, offset, length, position, function(writeErr, written) {
    if (writeErr) {
      fs.close(fd, function() {
        if (callback) callback(writeErr);
      });
    } else {
      if (written === length) {
        fs.close(fd, callback);
      } else {
        offset += written;
        length -= written;
        position += written;
        writeAll(fd, buffer, offset, length, position, callback);
      }
    }
  });
}

fs.writeFile = function(path, data, encoding_, callback) {
  var encoding = (typeof(encoding_) == 'string' ? encoding_ : 'utf8');
  var callback_ = arguments[arguments.length - 1];
  callback = (typeof(callback_) == 'function' ? callback_ : null);
  fs.open(path, 'w', 438 /*=0666*/, function(openErr, fd) {
    if (openErr) {
      if (callback) callback(openErr);
    } else {
      var buffer = Buffer.isBuffer(data) ? data : new Buffer('' + data,
          encoding);
      writeAll(fd, buffer, 0, buffer.length, 0, callback);
    }
  });
};

fs.writeFileSync = function(path, data, encoding) {
  var fd = fs.openSync(path, 'w');
  if (!Buffer.isBuffer(data)) {
    data = new Buffer('' + data, encoding || 'utf8');
  }
  var written = 0;
  var length = data.length;
  try {
    while (written < length) {
      written += fs.writeSync(fd, data, written, length - written, written);
    }
  } finally {
    fs.closeSync(fd);
  }
};

fs.appendFile = function(path, data, encoding_, callback) {
  var encoding = (typeof(encoding_) == 'string' ? encoding_ : 'utf8');
  var callback_ = arguments[arguments.length - 1];
  callback = (typeof(callback_) == 'function' ? callback_ : null);

  fs.open(path, 'a', 438 /*=0666*/, function(err, fd) {
    if (err) return callback(err);
    var buffer = Buffer.isBuffer(data) ? data : new Buffer('' + data, encoding);
    writeAll(fd, buffer, 0, buffer.length, null, callback);
  });
};

fs.appendFileSync = function(path, data, encoding) {
  var fd = fs.openSync(path, 'a');
  if (!Buffer.isBuffer(data)) {
    data = new Buffer('' + data, encoding || 'utf8');
  }
  var written = 0;
  var position = null;
  var length = data.length;

  try {
    while (written < length) {
      written += fs.writeSync(fd, data, written, length - written, position);
      position += written; // XXX not safe with multiple concurrent writers?
    }
  } finally {
    fs.closeSync(fd);
  }
};

function errnoException(errorno, syscall) {
  // TODO make this more compatible with ErrnoException from src/node.cc
  // Once all of Node is using this function the ErrnoException from
  // src/node.cc should be removed.
  var e = new Error(syscall + ' ' + errorno);
  e.errno = e.code = errorno;
  e.syscall = syscall;
  return e;
}


function FSWatcher() {
  var self = this;
  var FSEvent = process.binding('fs_event_wrap').FSEvent;
  this._handle = new FSEvent();
  this._handle.owner = this;

  this._handle.onchange = function(status, event, filename) {
    if (status) {
      self._handle.close();
      self.emit('error', errnoException(errno, 'watch'));
    } else {
      self.emit('change', event, filename);
    }
  };
}
util.inherits(FSWatcher, EventEmitter);

FSWatcher.prototype.start = function(filename, persistent) {
  var r = this._handle.start(pathModule._makeLong(filename), persistent);

  if (r) {
    this._handle.close();
    throw errnoException(errno, 'watch');
  }
};

FSWatcher.prototype.close = function() {
  this._handle.close();
};

fs.watch = function(filename) {
  var watcher;
  var options;
  var listener;

  if ('object' == typeof arguments[1]) {
    options = arguments[1];
    listener = arguments[2];
  } else {
    options = {};
    listener = arguments[1];
  }

  if (options.persistent === undefined) options.persistent = true;

  watcher = new FSWatcher();
  watcher.start(filename, options.persistent);

  if (listener) {
    watcher.addListener('change', listener);
  }

  return watcher;
};


// Stat Change Watchers

function StatWatcher() {
  var self = this;
  this._handle = new binding.StatWatcher();

  this._handle.onchange = function(current, previous) {
    self.emit('change', current, previous);
  };

  this._handle.onstop = function() {
    self.emit('stop');
  };
}
util.inherits(StatWatcher, EventEmitter);


StatWatcher.prototype.start = function(filename, persistent, interval) {
  this._handle.start(pathModule._makeLong(filename), persistent, interval);
};


StatWatcher.prototype.stop = function() {
  this._handle.stop();
};


var statWatchers = {};
function inStatWatchers(filename) {
  return Object.prototype.hasOwnProperty.call(statWatchers, filename) &&
      statWatchers[filename];
}


fs.watchFile = function(filename) {
  if (isWindows) {
    throw new Error('use fs.watch api instead');
  }

  var stat;
  var options;
  var listener;

  if ('object' == typeof arguments[1]) {
    options = arguments[1];
    listener = arguments[2];
  } else {
    options = {};
    listener = arguments[1];
  }

  if (!listener) {
    throw new Error('watchFile requires a listener function');
  }

  if (options.persistent === undefined) options.persistent = true;
  if (options.interval === undefined) options.interval = 0;

  if (inStatWatchers(filename)) {
    stat = statWatchers[filename];
  } else {
    stat = statWatchers[filename] = new StatWatcher();
    stat.start(filename, options.persistent, options.interval);
  }
  stat.addListener('change', listener);
  return stat;
};

fs.unwatchFile = function(filename) {
  var stat;
  if (inStatWatchers(filename)) {
    stat = statWatchers[filename];
    stat.stop();
    statWatchers[filename] = undefined;
  }
};

// Realpath
// Not using realpath(2) because it's bad.
// See: http://insanecoding.blogspot.com/2007/11/pathmax-simply-isnt.html

var normalize = pathModule.normalize,
    isWindows = process.platform === 'win32';

if (isWindows) {
  // Node doesn't support symlinks / lstat on windows. Hence realpath is just
  // the same as path.resolve that fails if the path doesn't exists.

  // windows version
  fs.realpathSync = function realpathSync(p, cache) {
    p = pathModule.resolve(p);
    if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
      return cache[p];
    }
    fs.statSync(p);
    if (cache) cache[p] = p;
    return p;
  };

  // windows version
  fs.realpath = function(p, cache, cb) {
    if (typeof cb !== 'function') {
      cb = cache;
      cache = null;
    }
    p = pathModule.resolve(p);
    if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
      return cb(null, cache[p]);
    }
    fs.stat(p, function(err) {
      if (err) return cb(err);
      if (cache) cache[p] = p;
      cb(null, p);
    });
  };


} else /* posix */ {

  // Regexp that finds the next partion of a (partial) path
  // result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;

  // posix version
  fs.realpathSync = function realpathSync(p, cache) {
    // make p is absolute
    p = pathModule.resolve(p);

    if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
      return cache[p];
    }

    var original = p,
        seenLinks = {},
        knownHard = {};

    // current character position in p
    var pos = 0;
    // the partial path so far, including a trailing slash if any
    var current = '';
    // the partial path without a trailing slash
    var base = '';
    // the partial path scanned in the previous round, with slash
    var previous = '';

    // walk down the path, swapping out linked pathparts for their real
    // values
    // NB: p.length changes.
    while (pos < p.length) {
      // find the next part
      nextPartRe.lastIndex = pos;
      var result = nextPartRe.exec(p);
      previous = current;
      current += result[0];
      base = previous + result[1];
      pos = nextPartRe.lastIndex;

      // continue if not a symlink, or if root
      if (!base || knownHard[base] || (cache && cache[base] === base)) {
        continue;
      }

      var resolvedLink;
      if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
        // some known symbolic link.  no need to stat again.
        resolvedLink = cache[base];
      } else {
        var stat = fs.lstatSync(base);
        if (!stat.isSymbolicLink()) {
          knownHard[base] = true;
          if (cache) cache[base] = base;
          continue;
        }

        // read the link if it wasn't read before
        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
        if (!seenLinks[id]) {
          fs.statSync(base);
          seenLinks[id] = fs.readlinkSync(base);
          resolvedLink = pathModule.resolve(previous, seenLinks[id]);
          // track this, if given a cache.
          if (cache) cache[base] = resolvedLink;
        }
      }

      // resolve the link, then start over
      p = pathModule.resolve(resolvedLink, p.slice(pos));
      pos = 0;
      previous = base = current = '';
    }

    if (cache) cache[original] = p;

    return p;
  };


  // posix version
  fs.realpath = function realpath(p, cache, cb) {
    if (typeof cb !== 'function') {
      cb = cache;
      cache = null;
    }

    // make p is absolute
    p = pathModule.resolve(p);

    if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
      return cb(null, cache[p]);
    }

    var original = p,
        seenLinks = {},
        knownHard = {};

    // current character position in p
    var pos = 0;
    // the partial path so far, including a trailing slash if any
    var current = '';
    // the partial path without a trailing slash
    var base = '';
    // the partial path scanned in the previous round, with slash
    var previous = '';

    // walk down the path, swapping out linked pathparts for their real
    // values
    LOOP();
    function LOOP() {
      // stop if scanned past end of path
      if (pos >= p.length) {
        if (cache) cache[original] = p;
        return cb(null, p);
      }

      // find the next part
      nextPartRe.lastIndex = pos;
      var result = nextPartRe.exec(p);
      previous = current;
      current += result[0];
      base = previous + result[1];
      pos = nextPartRe.lastIndex;

      // continue if known to be hard or if root or in cache already.
      if (!base || knownHard[base] || (cache && cache[base] === base)) {
        return process.nextTick(LOOP);
      }

      if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
        // known symbolic link.  no need to stat again.
        return gotResolvedLink(cache[base]);
      }

      return fs.lstat(base, gotStat);
    }

    function gotStat(err, stat) {
      if (err) return cb(err);

      // if not a symlink, skip to the next path part
      if (!stat.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        return process.nextTick(LOOP);
      }

      // stat & read the link if not read before
      // call gotTarget as soon as the link target is known
      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
      if (seenLinks[id]) {
        return gotTarget(null, seenLinks[id], base);
      }
      fs.stat(base, function(err) {
        if (err) return cb(err);

        fs.readlink(base, function(err, target) {
          gotTarget(err, seenLinks[id] = target);
        });
      });
    }

    function gotTarget(err, target, base) {
      if (err) return cb(err);

      var resolvedLink = pathModule.resolve(previous, target);
      if (cache) cache[base] = resolvedLink;
      gotResolvedLink(resolvedLink);
    }

    function gotResolvedLink(resolvedLink) {

      // resolve the link, then start over
      p = pathModule.resolve(resolvedLink, p.slice(pos));
      pos = 0;
      previous = base = current = '';

      return process.nextTick(LOOP);
    }
  };

}


var pool;

function allocNewPool() {
  pool = new Buffer(kPoolSize);
  pool.used = 0;
}



fs.createReadStream = function(path, options) {
  return new ReadStream(path, options);
};

var ReadStream = fs.ReadStream = function(path, options) {
  if (!(this instanceof ReadStream)) return new ReadStream(path, options);

  Stream.call(this);

  var self = this;

  this.path = path;
  this.fd = null;
  this.readable = true;
  this.paused = false;

  this.flags = 'r';
  this.mode = 438; /*=0666*/
  this.bufferSize = 64 * 1024;

  options = options || {};

  // Mixin options into this
  var keys = Object.keys(options);
  for (var index = 0, length = keys.length; index < length; index++) {
    var key = keys[index];
    this[key] = options[key];
  }

  if (this.encoding) this.setEncoding(this.encoding);

  if (this.start !== undefined) {
    if ('number' !== typeof this.start) {
      throw TypeError('start must be a Number');
    }
    if (this.end === undefined) {
      this.end = Infinity;
    } else if ('number' !== typeof this.end) {
      throw TypeError('end must be a Number');
    }

    if (this.start > this.end) {
      throw new Error('start must be <= end');
    }

    this.pos = this.start;
  }

  if (this.fd !== null) {
    this._read();
    return;
  }

  fs.open(this.path, this.flags, this.mode, function(err, fd) {
    if (err) {
      self.emit('error', err);
      self.readable = false;
      return;
    }

    self.fd = fd;
    self.emit('open', fd);
    self._read();
  });
};
util.inherits(ReadStream, Stream);

fs.FileReadStream = fs.ReadStream; // support the legacy name

ReadStream.prototype.setEncoding = function(encoding) {
  var StringDecoder = require('string_decoder').StringDecoder; // lazy load
  this._decoder = new StringDecoder(encoding);
};


ReadStream.prototype._read = function() {
  var self = this;
  if (!this.readable || this.paused || this.reading) return;

  this.reading = true;

  if (!pool || pool.length - pool.used < kMinPoolSpace) {
    // discard the old pool. Can't add to the free list because
    // users might have refernces to slices on it.
    pool = null;
    allocNewPool();
  }

  // Grab another reference to the pool in the case that while we're in the
  // thread pool another read() finishes up the pool, and allocates a new
  // one.
  var thisPool = pool;
  var toRead = Math.min(pool.length - pool.used, ~~this.bufferSize);
  var start = pool.used;

  if (this.pos !== undefined) {
    toRead = Math.min(this.end - this.pos + 1, toRead);
  }

  function afterRead(err, bytesRead) {
    self.reading = false;
    if (err) {
      self.emit('error', err);
      self.readable = false;
      return;
    }

    if (bytesRead === 0) {
      self.emit('end');
      self.destroy();
      return;
    }

    var b = thisPool.slice(start, start + bytesRead);

    // Possible optimizition here?
    // Reclaim some bytes if bytesRead < toRead?
    // Would need to ensure that pool === thisPool.

    // do not emit events if the stream is paused
    if (self.paused) {
      self.buffer = b;
      return;
    }

    // do not emit events anymore after we declared the stream unreadable
    if (!self.readable) return;

    self._emitData(b);
    self._read();
  }

  fs.read(this.fd, pool, pool.used, toRead, this.pos, afterRead);

  if (this.pos !== undefined) {
    this.pos += toRead;
  }
  pool.used += toRead;
};


ReadStream.prototype._emitData = function(d) {
  if (this._decoder) {
    var string = this._decoder.write(d);
    if (string.length) this.emit('data', string);
  } else {
    this.emit('data', d);
  }
};


ReadStream.prototype.destroy = function(cb) {
  var self = this;

  if (!this.readable) return;
  this.readable = false;

  function close() {
    fs.close(self.fd, function(err) {
      if (err) {
        if (cb) cb(err);
        self.emit('error', err);
        return;
      }

      if (cb) cb(null);
      self.emit('close');
    });
  }

  if (this.fd === null) {
    this.addListener('open', close);
  } else {
    close();
  }
};


ReadStream.prototype.pause = function() {
  this.paused = true;
};


ReadStream.prototype.resume = function() {
  this.paused = false;

  if (this.buffer) {
    var buffer = this.buffer;
    this.buffer = null;
    this._emitData(buffer);
  }

  // hasn't opened yet.
  if (null == this.fd) return;

  this._read();
};



fs.createWriteStream = function(path, options) {
  return new WriteStream(path, options);
};

var WriteStream = fs.WriteStream = function(path, options) {
  if (!(this instanceof WriteStream)) return new WriteStream(path, options);

  Stream.call(this);

  this.path = path;
  this.fd = null;
  this.writable = true;

  this.flags = 'w';
  this.encoding = 'binary';
  this.mode = 438; /*=0666*/
  this.bytesWritten = 0;

  options = options || {};

  // Mixin options into this
  var keys = Object.keys(options);
  for (var index = 0, length = keys.length; index < length; index++) {
    var key = keys[index];
    this[key] = options[key];
  }

  if (this.start !== undefined) {
    if ('number' !== typeof this.start) {
      throw TypeError('start must be a Number');
    }
    if (this.start < 0) {
      throw new Error('start must be >= zero');
    }

    this.pos = this.start;
  }

  this.busy = false;
  this._queue = [];

  if (this.fd === null) {
    this._open = fs.open;
    this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
    this.flush();
  }
};
util.inherits(WriteStream, Stream);

fs.FileWriteStream = fs.WriteStream; // support the legacy name

WriteStream.prototype.flush = function() {
  if (this.busy) return;
  var self = this;

  var args = this._queue.shift();
  if (!args) {
    if (this.drainable) { this.emit('drain'); }
    return;
  }

  this.busy = true;

  var method = args.shift(),
      cb = args.pop();

  args.push(function(err) {
    self.busy = false;

    if (err) {
      self.writable = false;
      if (cb) {
        cb(err);
      }
      self.emit('error', err);
      return;
    }

    if (method == fs.write) {
      self.bytesWritten += arguments[1];
      if (cb) {
        // write callback
        cb(null, arguments[1]);
      }

    } else if (method === self._open) {
      // save reference for file pointer
      self.fd = arguments[1];
      self.emit('open', self.fd);

    } else if (method === fs.close) {
      // stop flushing after close
      if (cb) {
        cb(null);
      }
      self.emit('close');
      return;
    }

    self.flush();
  });

  // Inject the file pointer
  if (method !== self._open) {
    args.unshift(this.fd);
  }

  method.apply(this, args);
};

WriteStream.prototype.write = function(data) {
  if (!this.writable) {
    this.emit('error', new Error('stream not writable'));
    return false;
  }

  this.drainable = true;

  var cb;
  if (typeof(arguments[arguments.length - 1]) == 'function') {
    cb = arguments[arguments.length - 1];
  }

  if (!Buffer.isBuffer(data)) {
    var encoding = 'utf8';
    if (typeof(arguments[1]) == 'string') encoding = arguments[1];
    data = new Buffer('' + data, encoding);
  }

  this._queue.push([fs.write, data, 0, data.length, this.pos, cb]);

  if (this.pos !== undefined) {
    this.pos += data.length;
  }

  this.flush();

  return false;
};

WriteStream.prototype.end = function(data, encoding, cb) {
  if (typeof(data) === 'function') {
    cb = data;
  } else if (typeof(encoding) === 'function') {
    cb = encoding;
    this.write(data);
  } else if (arguments.length > 0) {
    this.write(data, encoding);
  }
  this.writable = false;
  this._queue.push([fs.close, cb]);
  this.flush();
};

WriteStream.prototype.destroy = function(cb) {
  var self = this;

  if (!this.writable) return;
  this.writable = false;

  function close() {
    fs.close(self.fd, function(err) {
      if (err) {
        if (cb) { cb(err); }
        self.emit('error', err);
        return;
      }

      if (cb) { cb(null); }
      self.emit('close');
    });
  }

  if (this.fd === null) {
    this.addListener('open', close);
  } else {
    close();
  }
};

// There is no shutdown() for files.
WriteStream.prototype.destroySoon = WriteStream.prototype.end;


// SyncWriteStream is internal. DO NOT USE.
// Temporary hack for process.stdout and process.stderr when piped to files.
function SyncWriteStream(fd) {
  this.fd = fd;
  this.writable = true;
  this.readable = false;
}

util.inherits(SyncWriteStream, Stream);


// Export
fs.SyncWriteStream = SyncWriteStream;


SyncWriteStream.prototype.write = function(data, arg1, arg2) {
  var encoding, cb;

  // parse arguments
  if (arg1) {
    if (typeof arg1 === 'string') {
      encoding = arg1;
      cb = arg2;
    } else if (typeof arg1 === 'function') {
      cb = arg1;
    } else {
      throw new Error('bad arg');
    }
  }

  // Change strings to buffers. SLOW
  if (typeof data == 'string') {
    data = new Buffer(data, encoding);
  }

  fs.writeSync(this.fd, data, 0, data.length);

  if (cb) {
    process.nextTick(cb);
  }

  return true;
};


SyncWriteStream.prototype.end = function(data, arg1, arg2) {
  if (data) {
    this.write(data, arg1, arg2);
  }
  this.destroy();
};


SyncWriteStream.prototype.destroy = function() {
  fs.closeSync(this.fd);
  this.fd = null;
  this.emit('close');
  return true;
};

SyncWriteStream.prototype.destroySoon = SyncWriteStream.prototype.destroy;