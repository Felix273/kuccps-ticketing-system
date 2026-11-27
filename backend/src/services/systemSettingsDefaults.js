const { parseDelimitedValues } = require('./normalizedValues');

const DEFAULT_ALLOWED_FILE_TYPES = 'jpg,jpeg,png,gif,pdf,txt,csv,doc,docx,xls,xlsx,zip';

function getDefaultAllowedFileTypesRelation() {
  return {
    create: parseDelimitedValues(DEFAULT_ALLOWED_FILE_TYPES)
      .map(extension => ({ extension: extension.toLowerCase() }))
  };
}

module.exports = {
  DEFAULT_ALLOWED_FILE_TYPES,
  getDefaultAllowedFileTypesRelation
};
