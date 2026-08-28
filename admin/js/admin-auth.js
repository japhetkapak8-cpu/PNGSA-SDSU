import { supabase }
from "../../js/supabase.js";


export async function requireAdmin() {

    const {
        data: {
            session
        }
    } =
        await supabase.auth
            .getSession();


    if (!session) {

        window.location.replace(
            "../index.html"
        );

        return null;
    }


    const user =
        session.user;


    const {
        data: profile,
        error
    } =
        await supabase
            .from("profiles")
            .select("*")
            .eq(
                "id",
                user.id
            )
            .single();


    if (
        error ||
        !profile ||
        profile.role !== "admin"
    ) {

        window.location.replace(
            "../members/dashboard.html"
        );

        return null;
    }


    return {
        user,
        profile
    };
}


export async function adminSignOut() {

    await supabase.auth.signOut();

    window.location.replace(
        "../index.html"
    );
}