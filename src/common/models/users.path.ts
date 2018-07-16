export class UsersPathModel {
    constructor(
        public mentors = 'mentors',
        public padawans = 'padawan',
        public allUsers = 'all-users',
        public invitedUsers = 'my-request',
        public requestUsers = 'fetch-request'
    ) {}
}
