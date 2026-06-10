require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat-app';

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to', uri);
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema, 'users');

    const emailsToRemove = ['ci_test@example.com'];
    const namesToRemove = ['CI Test', 'clitest', 'CLI User', 'clitest@example.com'];

    const resEmail = await User.deleteMany({ email: { $in: emailsToRemove } });
    console.log('Deleted by email:', resEmail.deletedCount || 0);

    const resName = await User.deleteMany({ name: { $in: namesToRemove } });
    console.log('Deleted by name:', resName.deletedCount || 0);

    // also remove any users with email or name containing 'cli' or 'test'
    const resRegex = await User.deleteMany({ $or: [ { email: /ci_test|clitest|cli/i }, { name: /ci[_ -]?test|clitest|cli/i } ] });
    console.log('Deleted by regex:', resRegex.deletedCount || 0);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
