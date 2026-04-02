const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = '123456';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in your SQL INSERT statement:');
  console.log(`'${hash}'`);
}

generateHash();