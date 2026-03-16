import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { haptic } from "../shared/HapticFeedback";

const t = {
  en: { messages: "Messages", placeholder: "Type a message...", send: "Send", noMessages: "No messages yet. Send a message to your case officer.", noMessagesAdmin: "No messages yet from the tenant.", you: "You", caseOfficer: "Case Officer", tenant: "Tenant" },
  th: { messages: "ข้อความ", placeholder: "พิมพ์ข้อความ...", send: "ส่ง", noMessages: "ยังไม่มีข้อความ ส่งข้อความถึงเจ้าหน้าที่ของคุณ", noMessagesAdmin: "ยังไม่มีข้อความจากผู้เช่า", you: "คุณ", caseOfficer: "เจ้าหน้าที่", tenant: "ผู้เช่า" },
  zh: { messages: "消息", placeholder: "输入消息...", send: "发送", noMessages: "暂无消息。给案件负责人发送消息。", noMessagesAdmin: "暂无来自租户的消息。", you: "您", caseOfficer: "案件负责人", tenant: "租户" },
  ja: { messages: "メッセージ", placeholder: "メッセージを入力...", send: "送信", noMessages: "まだメッセージはありません。ケース担当者にメッセージを送信してください。", noMessagesAdmin: "テナントからのメッセージはまだありません。", you: "あなた", caseOfficer: "担当者", tenant: "テナント" },
  ko: { messages: "메시지", placeholder: "메시지를 입력하세요...", send: "전송", noMessages: "아직 메시지가 없습니다. 담당자에게 메시지를 보내세요.", noMessagesAdmin: "아직 세입자로부터 메시지가 없습니다.", you: "나", caseOfficer: "담당자", tenant: "세입자" },
  ru: { messages: "Сообщения", placeholder: "Введите сообщение...", send: "Отправить", noMessages: "Сообщений пока нет. Отправьте сообщение вашему сотруднику.", noMessagesAdmin: "Сообщений от арендатора пока нет.", you: "Вы", caseOfficer: "Сотрудник", tenant: "Арендатор" },
};

export default function CaseMessages({ caseItem, caseId, user, isAdmin, language, isDarkMode, colors }) {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const strings = t[language] || t.en;

  const messages = caseItem?.case_messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (text) => {
      const newMessage = {
        text,
        sender_email: user.email,
        sender_role: isAdmin ? "admin" : "user",
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, newMessage];
      await base44.entities.Case.update(caseId, { case_messages: updatedMessages });

      // Send email notification (fire-and-forget)
      base44.functions.invoke("sendCaseMessage", {
        caseId,
        caseNumber: caseItem.case_number,
        messageText: text,
        senderEmail: user.email,
        senderRole: isAdmin ? "admin" : "user",
        tenantEmail: caseItem.user_email,
      }).catch(err => console.warn("[CaseMessages] Email notification failed:", err));

      return updatedMessages;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      queryClient.invalidateQueries({ queryKey: ["allCases"] });
      setMessageText("");
      haptic.success();
    },
  });

  const handleSend = () => {
    const trimmed = messageText.trim();
    if (!trimmed || sendMutation.isPending) return;
    haptic.light();
    sendMutation.mutate(trimmed);
  };

  return (
    <Card className="border-none shadow-lg" style={{ backgroundColor: colors.cardBg }}>
      <CardHeader style={{ borderBottom: `1px solid ${colors.borderColor}` }} className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg" style={{ color: colors.textPrimary }}>
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          {strings.messages}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {/* Messages list */}
        <div
          className="space-y-3 mb-4 overflow-y-auto"
          style={{ maxHeight: "400px" }}
        >
          {messages.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: colors.textSecondary }}>
              {isAdmin ? strings.noMessagesAdmin : strings.noMessages}
            </p>
          )}
          {messages.map((msg, idx) => {
            const isOwn = msg.sender_email === user.email;
            return (
              <div
                key={idx}
                className="flex"
                style={{ justifyContent: isOwn ? "flex-end" : "flex-start" }}
              >
                <div
                  className="rounded-xl px-4 py-3 max-w-[80%]"
                  style={{
                    backgroundColor: isOwn
                      ? "#0C3B2E"
                      : isDarkMode ? "#374151" : "#F3F4F6",
                    color: isOwn ? "#FFFFFF" : colors.textPrimary,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold" style={{ opacity: 0.8 }}>
                      {isOwn
                        ? strings.you
                        : msg.sender_role === "admin"
                          ? strings.caseOfficer
                          : strings.tenant}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-xs mt-1" style={{ opacity: 0.6 }}>
                    {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={strings.placeholder}
            disabled={sendMutation.isPending}
            style={{
              flex: 1,
              padding: "12px 16px",
              backgroundColor: isDarkMode ? "#374151" : "#F8FAFC",
              border: `2px solid ${colors.borderColor}`,
              borderRadius: "12px",
              color: colors.textPrimary,
              fontSize: "14px",
              minHeight: "48px",
              outline: "none",
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sendMutation.isPending}
            className="px-4"
            style={{
              backgroundColor: "#0C3B2E",
              color: "#FFFFFF",
              borderRadius: "12px",
              minHeight: "48px",
            }}
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}