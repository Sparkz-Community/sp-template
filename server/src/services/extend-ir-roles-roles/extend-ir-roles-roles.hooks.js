const {fastJoin, iff} = require('feathers-hooks-common');
const {packages: {lodash: {lset, lget}}} = require('@iy4u/common-utils');
const {setField} = require('feathers-authentication-hooks');

const setEnvironment = setField({
  from: 'params.coreContext.environment._id',
  as: 'data.environment',
});

const userResolver = {
  joins: {
    children: {
      resolver: () => async (role, context) => {

        let createdBy = context.app.service('users').find({
          query: {_id: {$in: lget(role, 'createdBy', [])}},
          paginate: false
        });

        let abilityIds;
        if(role.abilityIds.length > 0){
          abilityIds = context.app.service('ir-roles-abilities').find({_id: {$in: lget(role, 'abilityIds')}});
        }

        let updatedBy = context.app.service('users').find({
          query: {_id: {$in: lget(role, 'updatedBy', [])}},
          paginate: false
        });

        await Promise.all([createdBy, updatedBy, abilityIds, ]).then((res) => {
          lset(role, '_fastjoin.createdBy', lget(res, '[0][0].email', 'No Email Found'));
          lset(role, '_fastjoin.updatedBy', lget(res, '[1][0].email', 'No Email Found'));
          lset(role, '_fastjoin.abilities', [...lget(res, '[2].data', [])]);
        }).catch((err) => {
          return err;
        });

      }
    }
  }
};

module.exports = {
  before: {
    all: [
      context => {
        context.service.options.whitelist = ['$options', '$regex', '$and'];
      },
    ],
    find: [],
    get: [],
    create: [
      setEnvironment,
    ],
    update: [
      setEnvironment,
    ],
    patch: [
      setEnvironment,
    ],
    remove: []
  },

  after: {
    all: [
      iff(ctx => !!ctx.params.userJoin, fastJoin(userResolver)),
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
