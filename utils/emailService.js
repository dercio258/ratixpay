const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Enviar email com link do conteúdo após pagamento bem-sucedido
    async enviarLinkConteudo(venda, produto) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: venda.clienteEmail,
                subject: `🎉 Pagamento Aprovado - Seu conteúdo está pronto!`,
                html: this.gerarTemplateEmail(venda, produto)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email enviado com sucesso:', result.messageId);
            return result;
        } catch (error) {
            console.error('❌ Erro ao enviar email:', error);
            throw error;
        }
    }

    // Gerar template HTML do email
    gerarTemplateEmail(venda, produto) {
        const dataFormatada = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagamento Aprovado - RatixPay</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .success-icon {
                    font-size: 48px;
                    color: #27ae60;
                    margin-bottom: 20px;
                }
                .title {
                    color: #2c3e50;
                    font-size: 24px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .info-section {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 5px 0;
                    border-bottom: 1px solid #e9ecef;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .label {
                    font-weight: bold;
                    color: #495057;
                }
                .value {
                    color: #6c757d;
                }
                .content-link {
                    background-color: #3498db;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    display: inline-block;
                    margin: 20px 0;
                    font-weight: bold;
                    text-align: center;
                    transition: background-color 0.3s;
                }
                .content-link:hover {
                    background-color: #2980b9;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e9ecef;
                    color: #6c757d;
                    font-size: 14px;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">RatixPay</div>
                    <div class="success-icon">✅</div>
                    <h1 class="title">Pagamento Aprovado!</h1>
                </div>

                <p>Olá <strong>${venda.clienteNome}</strong>,</p>
                
                <p>Seu pagamento foi processado com sucesso! Aqui estão os detalhes da sua compra:</p>

                <div class="info-section">
                    <div class="info-row">
                        <span class="label">Produto:</span>
                        <span class="value">${produto ? produto.nome : 'Produto Digital'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Valor Pago:</span>
                        <span class="value">${venda.pagamentoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'MZN' })}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Método de Pagamento:</span>
                        <span class="value">${venda.pagamentoMetodo}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">ID da Transação:</span>
                        <span class="value">${venda.pagamentoTransacaoId}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Data da Compra:</span>
                        <span class="value">${dataFormatada}</span>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="${produto ? produto.linkConteudo || '#' : '#'}" class="content-link">
                        📥 Acessar Conteúdo
                    </a>
                </div>

                <div class="warning">
                    <strong>⚠️ Importante:</strong> Guarde este email em local seguro. O link do conteúdo é válido por tempo indeterminado.
                </div>

                <p>Se você tiver alguma dúvida ou precisar de suporte, entre em contato conosco através do email de suporte.</p>

                <div class="footer">
                    <p>Obrigado por escolher RatixPay!</p>
                    <p>Este é um email automático, não responda a esta mensagem.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Enviar email de notificação para administrador
    async enviarNotificacaoAdmin(venda, produto) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                subject: `💰 Nova Venda Aprovada - ${venda.pagamentoTransacaoId}`,
                html: this.gerarTemplateNotificacaoAdmin(venda, produto)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Notificação admin enviada:', result.messageId);
            return result;
        } catch (error) {
            console.error('❌ Erro ao enviar notificação admin:', error);
            throw error;
        }
    }

    // Gerar template para notificação do administrador
    gerarTemplateNotificacaoAdmin(venda, produto) {
        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nova Venda Aprovada</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f8f9fa; }
                .info-row { margin: 10px 0; }
                .label { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💰 Nova Venda Aprovada</h1>
                </div>
                <div class="content">
                    <div class="info-row">
                        <span class="label">ID da Transação:</span> ${venda.pagamentoTransacaoId}
                    </div>
                    <div class="info-row">
                        <span class="label">Cliente:</span> ${venda.clienteNome} (${venda.clienteEmail})
                    </div>
                    <div class="info-row">
                        <span class="label">Produto:</span> ${produto ? produto.nome : 'Produto Digital'}
                    </div>
                    <div class="info-row">
                        <span class="label">Valor:</span> ${venda.pagamentoValor.toLocaleString('pt-BR', { style: 'currency', currency: 'MZN' })}
                    </div>
                    <div class="info-row">
                        <span class="label">Método:</span> ${venda.pagamentoMetodo}
                    </div>
                    <div class="info-row">
                        <span class="label">Data:</span> ${new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Verificar se o serviço de email está configurado
    isConfigurado() {
        return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    }
}

module.exports = new EmailService(); 