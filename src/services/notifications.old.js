import { supabase } from "../lib/supabase";

export async function createNotification({

    clubId,

    createdBy,

    createdByName,

    type,

    title,

    message,

    action,

    actionId

}){

    // Création de la notification

    const { data: notification, error } = await supabase

        .from("notifications")

        .insert({

            club_id: clubId,

            created_by: createdBy,

            created_by_name: createdByName,

            type,

            title,

            message,

            action,

            action_id: actionId

        })

        .select()

        .single();

    if(error) throw error;

    // Recherche des membres du club

    const {

        data: members,

        error: membersError

    } = await supabase

        .from("club_members")

        .select("profile_id")

        .eq("club_id", clubId);

    if(membersError) throw membersError;

    // Création des destinataires

    const receivers = members.map(member => ({

        notification_id: notification.id,

        profile_id: member.profile_id,

        is_read: member.profile_id === createdBy,

        delivered_at: new Date().toISOString(),

        read_at: member.profile_id === createdBy
            ? new Date().toISOString()
            : null

    }));

    const {

        error: receiverError

    } = await supabase

        .from("notification_users")

        .insert(receivers);

    if(receiverError) throw receiverError;

    return notification;

}

export async function getUnreadCount(){

    const {

        data:{user}

    } = await supabase.auth.getUser();

    if(!user) return 0;

    const {

        count,

        error

    } = await supabase

        .from("notification_users")

        .select("*",{

            count:"exact",

            head:true

        })

        .eq("profile_id",user.id)

        .eq("is_read",false);

    if(error){

        console.log(error);

        return 0;

    }

    return count || 0;

}