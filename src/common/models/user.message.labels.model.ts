export class UserMessageLabels {
    constructor(
        public SUCCESS_INVITED_USER = 'Вы успешно отправили приглашение пользователю',
        public ACCEPT_LEARNER = 'Вы приняли пользователя к себе в ученики',
        public REJECT_LEARNER = 'Вы отклонили заявку пользователя',
        public DELETE_LEARNER = 'Вы удалили пользователя из учеников',
        public ACCEPT_MENTOR = 'Пользователь стал вашим наставником',
        public REJECT_MENTOR = 'Вы отклонили заявку пользователя'
    ) {}
}
