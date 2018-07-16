export class DimmerLabels {
    constructor(
        public STD_DIMMER_HTTP_LOAD_MSG = 'Загрузка данных...',
        public STD_HTTP_DIMMER_MSG = 'Обработка запроса...',
        public STD_HTTP_DIMMER_ERROR_MSG = 'Ошибка соединения, запрос не отправлен!',
        public STD_DIMMER_MSG = 'Обработка данных...',
        public STD_DIMMER_ERROR_MSG = 'Ошибка, операция не выполнена!',
        public LOAD_POST_MSG = 'Загрузка постов...',
        public LOAD_POST_ERROR_MSG = 'Не удалось загрузить посты',
        public USER_MESSAGE_SENDING = 'Отправка сообщения...',
        public USER_MESSAGE_SENDING_ERROR = 'Ошибка, сообщение не отправлено!',
        public TR_PREPARE_TRAINING_DATA = 'Подготовка данных...',
        public TP_STD_DIMMER = 'Загрузка данных...',
        public SENDING_REQUEST = 'Отправка запроса...',
        public TP_COMMENT_SEND_MESSAGE_MSG = 'Отправка коментария...'
    ) {}
}
