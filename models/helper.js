const Counter = require('./counter.models')

async function generateCustomId(entityPrefix) {
  const counter = await Counter.findOneAndUpdate(
    { entity: entityPrefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }  // If no counter exists, create one
  );
  const id = `${entityPrefix}${String(counter.seq).padStart(3, '0')}`;
  return id;
}

module.exports = { generateCustomId };
